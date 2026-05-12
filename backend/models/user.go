package models

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"`
	Avatar    string    `json:"avatar"` // 存储头像的 URL
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
