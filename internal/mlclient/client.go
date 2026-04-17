package mlclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const pythonServiceURL = "http://127.0.0.1:5000/predict"

type PredictRequest struct {
	Code     string `json:"code"`
	Language string `json:"language"`
}

type PredictResponse struct {
	Probability   float64                `json:"probability"`
	IsAIGenerated bool                   `json:"is_ai_generated"`
	Features      map[string]interface{} `json:"features"`
	Error         string                 `json:"error,omitempty"`
}

func GetPrediction(code, language string) (*PredictResponse, error) {
	reqBody := PredictRequest{
		Code:     code,
		Language: language,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(pythonServiceURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("post to python service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("python service returned %d: %s", resp.StatusCode, string(body))
	}

	var result PredictResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	return &result, nil

