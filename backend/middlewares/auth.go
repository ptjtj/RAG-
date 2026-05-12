package middlewares

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			log.Println("警告: 环境变量 JWT_SECRET 未配置，登录守卫将失效！")
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "服务器配置错误"})
			c.Abort()
			return
		}
		jwtKey := []byte(jwtSecret)
		//获取 Header 中的 Authorization: Bearer <token>
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未登录或非法请求"})
			c.Abort()
			return
		}
		//剥离 Bearer 前缀，拿到纯 Token 字符串
		tokenString := authHeader[7:]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "身份凭证已过期或无效，请重新登录"})
			c.Abort()
			return
		}
		//把解析出来的 username 存入上下文，方便后面的控制器直接使用
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			if username, ok := claims["username"].(string); ok {
				c.Set("username", username)
			}
		}
		// 校验通过，放行请求到下一个处理函数
		c.Next()
	}
}

// 生成 Token 的公共函数
// GenerateToken 生成 JWT 令牌
func GenerateToken(username string, expiration time.Duration) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	jwtKey := []byte(jwtSecret)
	// 设置 Token 的 Payload (载荷)
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(expiration).Unix(), // 过期时间
		"iat":      time.Now().Unix(),                 // 签发时间
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}
