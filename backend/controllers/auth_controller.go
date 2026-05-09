package controllers

import (
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

func generateToken(username string, expireDuration time.Duration) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", fmt.Errorf("服务器未配置JWT密码")
	}
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(expireDuration).Unix(),
		"role":     "admin",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))

}

// 登录
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Code: 400, Message: "参数错误"})
		return
	}
	if req.Username != "admin" || req.Password != "123456" {
		c.JSON(http.StatusUnauthorized, models.Response{Code: 401, Message: "账号或密码错误"})
		return
	}
	//2 小时过期的短令牌 (Access Token)
	accessToken, err := generateToken(req.Username, 2*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "生成 Access Token 失败"})
		return
	}
	//生成一个 3 天过期的长令牌 (Refresh Token)
	refreshToken, err := generateToken(req.Username, 72*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Code: 500, Message: "生成 Refresh Token 失败"})
		return
	}
	// 将 Token 返回给前端
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "登录成功",
		Data: map[string]string{
			"accessToken":  accessToken,
			"refreshToken": refreshToken,
		},
	})
}

// 刷新令牌专用接口
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
	newAccessToken, err := generateToken(username, 2*time.Hour)
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
