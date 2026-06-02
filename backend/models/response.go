package models

// TempFileResponse 临时文件上传成功的返回数据
type TempFileResponse struct {
	FileId   string `json:"fileId" example:"temp_1715849201.pdf"`       // 唯一文件ID
	FileName string `json:"fileName" example:"需求文档.pdf"`                // 原始文件名
	Url      string `json:"url" example:"/uploads/temp_1715849201.pdf"` // 访问路径
}
