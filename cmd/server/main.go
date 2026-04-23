package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
)

const minChars = 50

func main() {
    r := gin.Default()

    wd, _ := os.Getwd()
    fmt.Println("Working directory:", wd)

    if _, err := os.Stat("frontend"); os.IsNotExist(err) {
        fmt.Println("'frontend' folder not found!")
        os.Exit(1)
    }

    r.Static("/static", "./frontend")
    r.GET("/", func(c *gin.Context) {
        c.File("./frontend/index.html")
    })

    r.POST("/api/detect", detectHandler)

    fmt.Println("Go server started on http://localhost:8080")
    r.Run(":8080")
}

func detectHandler(c *gin.Context) {
    code := strings.TrimSpace(c.PostForm("code"))
    language := c.PostForm("language")

    nonEmptyChars := countNonEmptyChars(code)
    if nonEmptyChars < minChars {
        c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(fmt.Sprintf(`
            <div class="result-error">
                <div class="error-prompt">$ validation_error</div>
                <div class="error-icon">⚠</div>
                <div class="error-title">[input_too_short]</div>
                <div class="error-message">нужно ещё %d символов</div>
                <div class="error-hint">> минимум: %d (сейчас: %d)</div>
            </div>
        `, minChars-nonEmptyChars, minChars, nonEmptyChars)))
        return
    }

    pred, err := getPrediction(code, language)
    if err != nil {
        c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(fmt.Sprintf(`
            <div class="result-error">
                <div class="error-prompt">$ service_error</div>
                <div class="error-icon">✖</div>
                <div class="error-title">[python_service_unavailable]</div>
                <div class="error-message">%v</div>
                <div class="error-hint">> запустите: cd python_service && ./start.sh</div>
            </div>
        `, err)))
        return
    }

    verdict := getVerdict(pred.Probability)
    color := "#AE65DB"
    verdictText := "AI-generated"
    if !pred.IsAIGenerated {
        color = "#5E8ADB"
        verdictText = "Human-written"
    }

    html := fmt.Sprintf(`
        <div class="result-success">
            <div class="terminal-prompt" style="margin-bottom: 1rem;">
                <span class="prompt-sign">$</span>
                <span class="prompt-text">./analyze --result</span>
                <span class="cursor">_</span>
            </div>
            <div class="probability" style="color: %s">
                %d%% — %s
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; margin: 1rem 0;">
                <div style="color: #5E8ADB;">> вердикт: %s</div>
            </div>
            <div class="features">
                <div style="color: #5E8ADB; margin-bottom: 0.5rem;">> метрики кода:</div>
                <ul>
                    <li>строк: %.0f</li>
                    <li>символов: %.0f</li>
                    <li>комментарии: %.1f%%</li>
                    <li>энтропия: %.2f</li>
                </ul>
            </div>
        </div>
    `, color, int(pred.Probability*100), verdictText, verdict,
        pred.Features["line_count"], pred.Features["char_count"],
        pred.Features["comment_ratio"]*100, pred.Features["entropy"])

    c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

func countNonEmptyChars(s string) int {
    count := 0
    for _, r := range s {
        if r != ' ' && r != '\n' && r != '\r' && r != '\t' {
            count++
        }
    }
    return count
}

func getVerdict(prob float64) string {
    if prob < 0.3 {
        return "Скорее написан человеком"
    } else if prob < 0.7 {
        return "Неопределённо"
    }
    return "С высокой вероятностью сгенерирован ИИ"
}

type PredictRequest struct {
    Code     string `json:"code"`
    Language string `json:"language"`
}

type PredictResponse struct {
    Probability   float64                `json:"probability"`
    IsAIGenerated bool                   `json:"is_ai_generated"`
    Features      map[string]interface{} `json:"features"`
}

func getPrediction(code, language string) (*PredictResponse, error) {
    reqBody := PredictRequest{Code: code, Language: language}
    jsonData, _ := json.Marshal(reqBody)

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Post("http://127.0.0.1:5000/predict", "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, fmt.Errorf("Python сервис недоступен")
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("ошибка: %s", string(body))
    }

    var result PredictResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return &result, nil
}
