package services

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type MLResponse struct {
	Label      string   `json:"label"`
	Confidence float64  `json:"confidence"`
	Features   []string `json:"features"`
}

func CallML(code string) (MLResponse, error) {
	reqBody, _ := json.Marshal(map[string]string{
		"code": code,
	})

	resp, err := http.Post(
		"http://127.0.0.1:8001/predict",
		"application/json",
		bytes.NewBuffer(reqBody),
	)

	if err != nil {
		return MLResponse{}, err
	}
	defer resp.Body.Close()

	var result MLResponse
	json.NewDecoder(resp.Body).Decode(&result)

	return result, nil
}
