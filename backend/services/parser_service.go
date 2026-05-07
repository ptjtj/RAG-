package services

import (
	"archive/zip"
	"backend/config"
	"backend/models"
	"bytes"
	"encoding/json"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"

	"github.com/ledongthuc/pdf"
)

// ParseDocument 后台解析文档的入口函数
func ParseDocument(doc models.Document, chunkSize int) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("致命错误：解析文档时崩溃，可能是不支持的 PDF 格式。原因: %v", r)
			// 即使崩溃了，也要体面地把状态改成 failed
			updateDocStatus(doc.ID, "failed")
		}
	}()
	log.Printf("开始解析文档: %s\", doc.FileName\n")
	var text string
	var err error
	// 根据不同文件类型，提取纯文本
	ext := filepath.Ext(doc.FileName)
	if ext == ".txt" {
		text, err = readTxt(doc.FilePath)
	} else if ext == ".docx" {
		text, err = readDocx(doc.FilePath)
	} else if ext == ".pdf" {
		text, err = readPdf(doc.FilePath)
	} else {
		updateDocStatus(doc.ID, "failed")
		log.Printf("❌ 暂不支持的文件格式: %s", ext)
		return
	}
	if err != nil || text == "" {
		updateDocStatus(doc.ID, "failed")
		log.Printf("❌ 读取文件失败: %v", err)
		return
	}

	// 将长文本进行切片 (Chunking)
	chunks := splitText(text, chunkSize)

	//  将切片保存到数据库
	for _, content := range chunks {
		vec, err := GetEmbedding(content)
		var vecStr string
		var isEmbedded bool
		if err == nil && len(vec) > 0 {
			vecBytes, _ := json.Marshal(vec)
			vecStr = string(vecBytes)
			isEmbedded = true
		} else {
			log.Printf("警告：切片 [%s...] 向量化失败: %v", content[:10], err)
		}
		// 保存入库，带上向量数据
		chunkRecord := models.DocumentChunk{
			DocumentID: doc.ID,
			Content:    content,
			Vector:     vecStr,     //存入刚刚算出来的长串数字
			IsEmbedded: isEmbedded, //标记已向量化
			WordCount:  len([]rune(content)),
		}
		config.DB.Create(&chunkRecord)
	}

	// 更新文档状态为：解析成功
	config.DB.Model(&models.Document{}).Where("id = ?", doc.ID).Updates(map[string]interface{}{
		"status":      "success",
		"chunk_count": len(chunks),
	})

	log.Printf("✅ 文档解析成功: %s, 共切出 %d 个片段", doc.FileName, len(chunks))
}

// === 下面是底层辅助函数 ===

// 更新文档状态
func updateDocStatus(docID string, status string) {
	config.DB.Model(&models.Document{}).Where("id = ?", docID).Update("status", status)
}

// 读取 TXT 文件
func readTxt(path string) (string, error) {
	bytes, err := os.ReadFile(path)
	return string(bytes), err
}

// 极其巧妙的无依赖 DOCX 读取法
func readDocx(path string) (string, error) {
	r, err := zip.OpenReader(path)
	if err != nil {
		return "", err
	}
	defer r.Close()

	var text string
	for _, f := range r.File {
		// DOCX 的核心文本都藏在这个 word/document.xml 文件里
		if f.Name == "word/document.xml" {
			rc, err := f.Open()
			if err != nil {
				return "", err
			}
			content, _ := io.ReadAll(rc)
			rc.Close()

			// 用正则把 XML 标签全部扒掉，只留纯汉字和英文字母
			re := regexp.MustCompile(`<[^>]+>`)
			text = re.ReplaceAllString(string(content), " ")
			break
		}
	}
	return text, nil
}

// PDF 函数
func readPdf(path string) (string, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	b, err := r.GetPlainText()
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	buf.ReadFrom(b)
	return buf.String(), nil
}

// 切片核心逻辑：按字数切断
func splitText(text string, size int) []string {
	// 将字符串转为 rune 数组，完美处理中文字符
	runes := []rune(text)
	var chunks []string

	for i := 0; i < len(runes); i += size {
		end := i + size
		if end > len(runes) {
			end = len(runes)
		}
		chunks = append(chunks, string(runes[i:end]))
	}
	return chunks
}
