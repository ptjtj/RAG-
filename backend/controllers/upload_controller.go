package controllers

import (
	"backend/models"
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadTempFile 上传临时分析文件
// @Summary 上传临时会话附件
// @Description 用户在对话框上传临时文件（PDF/Word/Excel等），不存入全局知识库，仅供当前会话大模型分析使用。
// @Tags 智能对话
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "需要上传的文件 (最大 10MB)"
// @Success 200 {object} models.Response{data=models.TempFileResponse} "上传成功"
// @Failure 400 {object} models.Response "获取文件失败或格式错误"
// @Failure 500 {object} models.Response "服务器保存文件失败"
// @Router /upload/temp [post]
func UploadTempFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "获取上传文件失败"})
		return
	}
	//生成唯一文件名防冲突 (时间戳 + 原始后缀)
	ext := filepath.Ext(file.Filename)
	uniqueFileName := fmt.Sprintf("temp_%d%s", time.Now().UnixNano(), ext)
	//指定保存路径
	savePath := filepath.Join("./upload/temp", uniqueFileName)
	//存入本地磁盘
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "文件保存失败"})
		return
	}
	//返回前端所需的数据
	resData := models.TempFileResponse{
		FileId:   uniqueFileName,
		FileName: file.Filename,
		Url:      fmt.Sprintf("/uploads/temp/%s", uniqueFileName),
	}
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "上传成功", Data: resData})
}
