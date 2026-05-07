// services/vector_service.go
package services

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"math"
	"sort"
)

// SearchResult 搜索结果结构体
type SearchResult struct {
	Content string
	Score   float32
	Title   string
}
type SourceItem struct {
	Title string  `json:"title"`
	Score float32 `json:"score"`
}

func CosineSimilarity(v1, v2 []float32) float32 {
	if len(v1) == 0 || len(v2) == 0 || len(v1) != len(v2) {
		return 0
	}
	var dotProduct, m1, m2 float64
	for i := 0; i < len(v1); i++ {
		dotProduct += float64(v1[i] * v2[i])
		m1 += float64(v1[i] * v1[i])
		m2 += float64(v2[i] * v2[i])
	}
	if m1 == 0 || m2 == 0 {
		return 0
	}
	return float32(dotProduct / (math.Sqrt(m1) * math.Sqrt(m2)))
}

// SearchTopChunksWithSources 升级版语义检索：返回内容的同时，返回溯源信息
func SearchTopChunksWithSources(kbID uint, userQuery string) (string, []SourceItem, error) {
	queryVec, err := GetEmbedding(userQuery)
	if err != nil {
		return "", nil, err
	}

	//连表查询：不仅查出切片，还要把所属的文档名字 (file_name) 查出来
	type ChunkWithDoc struct {
		models.DocumentChunk
		FileName string `gorm:"column:file_name"`
	}
	var allChunks []ChunkWithDoc

	config.DB.Table("document_chunks").
		Select("document_chunks.*, documents.file_name").
		Joins("JOIN documents ON documents.id = document_chunks.document_id").
		Where("documents.knowledge_base_id = ? AND document_chunks.is_embedded = ?", kbID, true).
		Find(&allChunks)

	// 计算相似度
	type scoredChunk struct {
		Content string
		Title   string
		Score   float32
	}
	var scores []scoredChunk

	for _, chunk := range allChunks {
		var chunkVec []float32
		json.Unmarshal([]byte(chunk.Vector), &chunkVec)

		score := CosineSimilarity(queryVec, chunkVec)
		if score > 0.4 { // 相似度阈值
			scores = append(scores, scoredChunk{Content: chunk.Content, Title: chunk.FileName, Score: score})
		}
	}

	//  按分数从高到低排序
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Score > scores[j].Score
	})

	//  组装背景知识和溯源标签
	var contextStr string
	var sources []SourceItem
	sourceMap := make(map[string]bool) // 用于去重，防止同一份文档显示多个相同标签

	count := 0
	for _, s := range scores {
		if count >= 3 {
			break
		}
		contextStr += "- " + s.Content + "\n"

		// 收集不重复的文档来源
		if !sourceMap[s.Title] {
			sources = append(sources, SourceItem{Title: s.Title, Score: s.Score})
			sourceMap[s.Title] = true
		}
		count++
	}

	return contextStr, sources, nil
}
