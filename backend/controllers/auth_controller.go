package controllers

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// 登录
// @Summary 用户登录
// @Description 用户输入账号和密码进行登录，成功后返回短令牌 (accessToken) 和长令牌 (refreshToken)
// @Tags 认证 (Auth)
// @Accept json
// @Produce json
// @Param data body LoginRequest true "登录账号和密码"
// @Success 200 {object} models.Response "成功"
// @Failure 400 {object} models.Response "参数错误"
// @Failure 401 {object} models.Response "账号或密码错误"
// @Router /login [post]
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误"})
		return
	}

	var user models.User
	result := config.DB.Where("username = ?", req.Username).First(&user)

	if result.Error != nil {
		// 数据库没查到该用户，检查是否是空库初始状态
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "账号不存在或密码错误"})
		return

	}

	if user.Password != req.Password {
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "账号或密码错误"})
		return
	}

	// 签发 2 小时过期的短令牌 (Access Token)
	accessToken, err := middlewares.GenerateToken(user.Username, 2*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "生成 Access Token 失败"})
		return
	}

	// 签发 3 天过期的长令牌 (Refresh Token)
	refreshToken, err := middlewares.GenerateToken(user.Username, 72*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "生成 Refresh Token 失败"})
		return
	}
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "登录成功",
		Data: map[string]interface{}{
			"accessToken":  accessToken,
			"refreshToken": refreshToken,
			"user":         user, // 把用户数据一并返回给前端
		},
	})
}

// @Description 使用长令牌换取新的短令牌
// @Tags 认证 (Auth)
// @Accept json
// @Produce json
// @Param data body RefreshRequest true "刷新参数"
// @Success 200 {object} models.Response "成功"
// @Router /refresh [post]
// 刷新令牌专用接口
// @Summary 刷新 Access Token
func RefreshToken(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "缺少 refreshToken 参数"})
		return
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	//解析前端传来的长令牌
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("非法的签名算法")
		}
		return []byte(jwtSecret), nil
	})
	//如果长令牌解析失败、被篡改、或者超过了 3 天过期了
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "登录身份已彻底过期，请重新登录"})
		return
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "Token 格式错误"})
		return
	}
	username := claims["username"].(string)
	//长令牌合法,立刻为该用户签发一个全新的 2 小时短令牌
	newAccessToken, err := middlewares.GenerateToken(username, 2*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "刷新 Token 失败"})
		return
	}
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "刷新成功",
		Data: map[string]string{
			"accessToken": newAccessToken,
		},
	})
}
