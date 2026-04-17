package main

import (
	"Backend/handlers"
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/api/detect", handlers.DetectHandler)

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
