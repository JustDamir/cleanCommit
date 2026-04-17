package utils

import (
	"fmt"
	"net/http"
)

type MLResponse struct {
	Label      string
	Confidence float64
	Features   []string
}

func WriteSuccess(w http.ResponseWriter, res MLResponse) {
	prob := int(res.Confidence * 100)

	class := "probability-low"
	if prob > 70 {
		class = "probability-high"
	}

	featuresHTML := ""
	for _, f := range res.Features {
		featuresHTML += fmt.Sprintf("<li>%s</li>", f)
	}

	html := fmt.Sprintf(`
<div class="result-success">
    <div class="probability %s">Вероятность ИИ: %d%%</div>
    <div class="features">
        <strong>🔍 Ключевые признаки:</strong>
        <ul>%s</ul>
    </div>
</div>
`, class, prob, featuresHTML)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(200)
	w.Write([]byte(html))
}

func WriteError(w http.ResponseWriter, code, message string) {
	html := fmt.Sprintf(`
<div class="result-error">
    <div class="error-title">[%s]</div>
    <div class="error-message">%s</div>
</div>
`, code, message)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(400)
	w.Write([]byte(html))
}
