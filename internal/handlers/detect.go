package handler

import (
	"clean-commit-backend/internal/mlclient"
	"fmt"
	"html/template"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const minChars = 50

// Парсинг шаблона результата
var resultTemplate = template.Must(template.ParseFiles("internal/templates/result.gohtml"))

func DetectHandler(c *gin.Context) {
	code := strings.TrimSpace(c.PostForm("code"))
	language := c.PostForm("language")

	// Подсчёт непустых символов (исключая пробелы и переводы строк)
	nonEmptyChars := countNonEmptyChars(code)
	if nonEmptyChars < minChars {
		c.HTML(http.StatusOK, "result.gohtml", gin.H{
			"Error":        true,
	 "ErrorTitle":   "input_too_short",
	 "ErrorMessage": fmt.Sprintf("требуется ещё %d символов для анализа", minChars-nonEmptyChars),
		       "MinChars":     minChars,
	 "CurrentChars": nonEmptyChars,
		})
		return
	}

	// Вызов Python-сервиса с моделью
	pred, err := mlclient.GetPrediction(code, language)
	if err != nil {
		c.HTML(http.StatusOK, "result.gohtml", gin.H{
			"Error":        true,
	 "ErrorTitle":   "model_error",
	 "ErrorMessage": fmt.Sprintf("Ошибка анализа: %v", err),
		})
		return
	}

	// Подготовка данных для шаблона
	data := gin.H{
		"Success":            true,
		"Probability":        pred.Probability,
		"IsAI":               pred.IsAIGenerated,
		"ProbabilityPercent": int(pred.Probability * 100),
		"Verdict":            getVerdict(pred.Probability),
		"Features":           pred.Features,
	}

	c.HTML(http.StatusOK, "result.gohtml", data)
}

// Подсчёт символов без учёта пробельных символов
func countNonEmptyChars(s string) int {
	count := 0
	for _, r := range s {
		if r != ' ' && r != '\n' && r != '\r' && r != '\t' {
			count++
		}
	}
	return count
}

// Текстовый вердикт на основе вероятности
func getVerdict(prob float64) string {
	if prob < 0.3 {
		return "Скорее написан человеком"
	} else if prob < 0.7 {
		return "Неопределённо"
	} else {
		return "С высокой вероятностью сгенерирован ИИ"
	}
}
