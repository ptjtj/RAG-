package controllers

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// UpdatePasswordRequest 修改密码请求参数 (抽离出来方便 Swagger 生成文档和 TS 类型)
type UpdatePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required" example:"123456"`
	NewPassword string `json:"newPassword" binding:"required" example:"654321"`
}

// UpdateUsernameRequest 修改用户名请求参数
type UpdateUsernameRequest struct {
	NewUsername string `json:"newUsername" binding:"required" example:"super_admin"`
}
type RegisterRequest struct {
	Username string `json:"username" binding:"required" example:"new_user"`
	Password string `json:"password" binding:"required" example:"123456"`
}

// UpdatePassword 修改密码
// @Summary 修改当前用户密码
// @Description 验证旧密码并更新为新密码，更新后需要重新登录
// @Tags 用户 (User)
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param data body UpdatePasswordRequest true "修改密码的参数"
// @Success 200 {object} models.Response "成功"
// @Router /user/password [put]
func UpdatePassword(c *gin.Context) {
	var req UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误"})
		return
	}

	// 从中间件设置的 Context 中获取当前登录用户名 (由 JWT 中间件解析设置)
	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "未授权"})
		return
	}

	var user models.User
	if err := config.DB.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, models.Response{Code: 404, Message: "用户不存在"})
		return
	}

	// 校验旧密码是否正确
	if user.Password != req.OldPassword {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "旧密码错误"})
		return
	}

	// 更新为新密码
	if err := config.DB.Model(&user).Update("password", req.NewPassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "更新失败"})
		return
	}

	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "密码修改成功"})
}

// UploadAvatar 上传头像
// @Summary 上传用户头像
// @Description 接收前端传来的图片文件，保存到本地并更新数据库中的头像 URL
// @Tags 用户 (User)
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "头像图片文件"
// @Success 200 {object} models.Response "成功"
// @Router /user/avatar [post]
func UploadAvatar(c *gin.Context) {
	// 获取前端传来的文件（字段名必须为 "file"）
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "无效的文件"})
		return
	}
	// 准备保存路径（确保 backend 目录下有 uploads/avatars 文件夹）
	uploadPath := "./uploads/avatars"
	if _, err := os.Stat(uploadPath); os.IsNotExist(err) {
		// 如果文件夹不存在，自动创建它
		os.MkdirAll(uploadPath, os.ModePerm)
	}

	// 生成唯一文件名 (时间戳 + 原文件名)，防止不同用户传了同名图片被覆盖
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
	dst := filepath.Join(uploadPath, filename)

	//  保存文件到本地磁盘
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "文件保存失败"})
		return
	}

	// 更新数据库中该用户的头像字段
	username, _ := c.Get("username")

	// 生成外部可访问的 URL 地址

	avatarURL := fmt.Sprintf("http://localhost:8080/uploads/avatars/%s", filename)

	if err := config.DB.Model(&models.User{}).Where("username = ?", username).Update("avatar", avatarURL).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "数据库更新失败"})
		return
	}

	// 返回新的头像 URL 给前端
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "上传成功",
		Data:    avatarURL,
	})
}

// ClearAvatar 撤销/移除头像
// @Summary 移除当前用户头像
// @Description 将当前登录用户的头像字段清空为默认状态
// @Tags 用户 (User)
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.Response "成功"
// @Router /user/avatar [delete]
func ClearAvatar(c *gin.Context) {
	username, _ := c.Get("username")

	// 把头像字段更新为空字符串
	if err := config.DB.Model(&models.User{}).Where("username = ?", username).Update("avatar", "").Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "移除头像失败"})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "头像已移除",
		Data:    "", // 返回空字符串给前端
	})
}

// UpdateUsername 修改用户名
// @Summary 修改当前用户名
// @Description 修改用户名后，JWT 令牌会失效，前端需要强制重新登录
// @Tags 用户 (User)
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param data body UpdateUsernameRequest true "修改用户名的参数"
// @Success 200 {object} models.Response "成功"
// @Router /user/username [put]
func UpdateUsername(c *gin.Context) {
	var req UpdateUsernameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误"})
		return
	}
	oldUsername, _ := c.Get("username")
	if req.NewUsername == oldUsername {
		c.JSON(http.StatusOK, models.Response{Code: 200, Message: "用户名未改变"})
		return
	}

	// 检查新用户名是否被别人注册了 (因为 username 在数据库里是 Unique 唯一的)
	var count int64
	config.DB.Model(&models.User{}).Where("username = ?", req.NewUsername).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "该用户名已被占用，请换一个"})
		return
	}

	// 执行更新
	result := config.DB.Model(&models.User{}).Where("username = ?", oldUsername).Update("username", req.NewUsername)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "数据库更新失败"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "账号状态异常，请退出重新登录后再修改！"})
		return
	}
	userIDInterface, _ := c.Get("userID")
	userID := userIDInterface.(uint)
	accessToken, err1 := middlewares.GenerateToken(userID, req.NewUsername, 2*time.Hour)
	refreshToken, err2 := middlewares.GenerateToken(userID, req.NewUsername, 7*24*time.Hour)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "生成新令牌失败"})
		return
	}
	//获取更新后的完整用户信息返回给前端展示
	var newUser models.User
	config.DB.Where("username = ?", req.NewUsername).First(&newUser)
	//拼装数据结构返回
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "用户名修改成功，请重新登录",
		Data: gin.H{
			"accessToken":  accessToken,
			"refreshToken": refreshToken,
			"user":         newUser,
		},
	})
}

// Register 注册新用户
// @Summary 注册新用户 (添加用户)
// @Description 管理员在后台添加新用户
// @Tags 认证 (Auth)
// @Accept json
// @Produce json
// @Param data body RegisterRequest true "注册参数"
// @Success 200 {object} models.Response "成功"
// @Router /register [post]
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误"})
		return
	}

	var count int64
	config.DB.Model(&models.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "该用户名已被注册"})
		return
	}

	newUser := models.User{
		Username: req.Username,
		Password: req.Password, // 实际生产中记得加密
	}

	if err := config.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "创建用户失败"})
		return
	}

	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "用户添加成功"})
}

// GetUserList 获取用户列表
// @Summary 获取用户列表
// @Description 在用户管理表格中展示所有用户
// @Tags 用户 (User)
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.Response "成功"
// @Router /users [get]
func GetUserList(c *gin.Context) {
	var users []models.User
	// 按照创建时间倒序排列，新创建的用户在最前面
	if err := config.DB.Order("created_at desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "获取用户列表失败"})
		return
	}
	// 出于安全考虑，返回给前端的列表可以把密码脱敏（清空）
	for i := range users {
		users[i].Password = ""
	}
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "获取成功",
		Data:    users,
	})
}

// DeleteUser 删除指定用户
// @Summary 删除用户
// @Description 管理员在后台删除指定用户，超级管理员(admin)不能被删除
// @Tags 用户 (User)
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "要删除的用户ID"
// @Success 200 {object} models.Response "成功"
// @Router /users/{id} [delete]
func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	//先查询这个用户存不存在
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, models.Response{Code: 404, Message: "用户不存在"})
		return
	}
	//绝对不允许删除 admin！
	if user.Username == "admin" {
		c.JSON(http.StatusForbidden, models.Response{Code: 403, Message: "超级管理员账号禁止删除！"})
		return
	}
	// 执行删除操作
	if err := config.DB.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "删除失败"})
		return
	}
	c.JSON(http.StatusOK, models.Response{Code: 200, Message: "删除成功"})
}
