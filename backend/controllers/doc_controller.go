// controllers/doc_controller.go
package controllers

import (
	"crypto/md5"   // 计算 MD5
	"encoding/hex" // 将 MD5 转成字符串
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"backend/config"
	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetDocuments 获取指定知识库的文档列表
// ... (原有注释保持不变)
func GetDocuments(c *gin.Context) {
	kbID := c.Param("kb_id")
	var docs []models.Document

	// 查询知识库ID匹配的文档
	config.DB.Where("knowledge_base_id = ?", kbID).Order("id desc").Find(&docs)
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "success", Data: docs})
}

// UploadDocument 上传文档到知识库

func UploadDocument(c *gin.Context) {
	kbIDStr := c.Param("kb_id")
	kbID, err := strconv.Atoi(kbIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "无效的知识库 ID"})
		return
	}

	// 从请求中获取文件
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "未获取到文件: " + err.Error()})
		return
	}

	// ================= 新增核心逻辑： 计算 MD5 并查重 =================
	fileContent, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "无法读取文件内容"})
		return
	}
	defer fileContent.Close()

	// 计算文件的 MD5 指纹
	hash := md5.New()
	io.Copy(hash, fileContent)
	md5Str := hex.EncodeToString(hash.Sum(nil))

	// 去 MySQL 里查一下，这个知识库下有没有同样的 MD5
	var existingDoc models.Document
	err = config.DB.Where("knowledge_base_id = ? AND file_md5 = ?", kbID, md5Str).First(&existingDoc).Error
	if err == nil {
		// 如果 err == nil，说明数据库里找到了！直接拦截，不再往下执行保存逻辑
		c.JSON(http.StatusOK, models.Response{
			Code:    200,
			Message: "该文件之前已上传过啦，无需重复上传",
			Data:    existingDoc,
		})
		return
	}
	// ================= 查重逻辑结束 =================

	// 准备保存目录 (项目根目录下的 uploads/kb_id/ 文件夹)
	uploadDir := fmt.Sprintf("./uploads/kb_%d", kbID)
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "创建上传目录失败"})
		return
	}

	// 生成安全的文件名并保存到服务器磁盘
	fileName := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
	savePath := filepath.Join(uploadDir, fileName)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "保存文件失败"})
		return
	}

	//将文件信息保存到 MySQL 数据库
	doc := models.Document{
		KnowledgeBaseID: uint(kbID),
		FileName:        file.Filename,
		FileMD5:         md5Str,
		FileSize:        file.Size,
		FileType:        filepath.Ext(file.Filename),
		FilePath:        savePath,
		Status:          "pending",
	}

	if err := config.DB.Create(&doc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "记录数据库失败"})
		return
	}
	config.DB.Model(&models.KnowledgeBase{}).
		Where("id = ?", kbID).
		Updates(map[string]interface{}{
			"doc_count": gorm.Expr("doc_count + ?", 1),
		})

	// 开启一个协程(Goroutine)，去后台默默地解析文档
	go services.ParseDocument(doc, 500)

	// 前端直接秒回“上传成功”
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "文件上传成功", Data: doc})
}

// controllers/doc_controller.go

// DeleteDocument 删除指定的文档及其关联数据
// @Summary 删除文档
// @Description 删除文档记录、关联的切片数据以及本地物理文件
// @Tags Document
// @Param doc_id path string true "文档 ID"
// @Success 200 {object} models.Response
// @Router /docs/{doc_id} [delete]
// @ID deleteDocument
func DeleteDocument(c *gin.Context) {
	docID := c.Param("doc_id")

	//先查出这个文档的信息（主要是为了拿到它的物理路径）
	var doc models.Document
	if err := config.DB.Where("id = ?", docID).First(&doc).Error; err != nil {
		c.JSON(http.StatusNotFound, models.Response{Code: 404, Message: "文档不存在"})
		return
	}

	// 删除服务器磁盘上的物理文件
	if doc.FilePath != "" {
		os.Remove(doc.FilePath) // 忽略错误，哪怕文件被手动删了也没关系
	}

	//  彻底删除数据库里的文档切片 (Chunks)
	config.DB.Unscoped().Where("document_id = ?", docID).Delete(&models.DocumentChunk{})

	// 彻底删除文档记录本身
	if err := config.DB.Unscoped().Delete(&doc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "删除记录失败"})
		return
	}
	config.DB.Model(&models.KnowledgeBase{}).
		Where("id = ? AND doc_count >0", doc.KnowledgeBaseID).
		Updates(map[string]interface{}{
			"doc_count": gorm.Expr("doc_count - ?", 1),
		})
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "删除成功"})
}

// TestEmbedding 测试获取文本的数字指纹
func TestEmbedding(c *gin.Context) {
	// 从请求体中获取要测试的文本
	var req struct {
		Text string `json:"text"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误"})
		return
	}

	if req.Text == "" {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "文本不能为空"})
		return
	}

	// 调用我们在 services 里写好的 GetEmbedding 方法
	vector, err := services.GetEmbedding(req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "获取指纹失败: " + err.Error()})
		return
	}

	// 把拿到的向量返回给前端
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "成功获取数字指纹",
		// 这里我们只返回前 10 个数字演示，不然 2048 个数字会把屏幕撑爆
		Data: map[string]interface{}{
			"dimensions": len(vector), // 总维度
			"preview":    vector[:10], // 前 10 个数字的预览
		},
	})
}
