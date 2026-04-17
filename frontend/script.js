// Элементы DOM
const textarea = document.getElementById('code');
const lineNumbers = document.getElementById('lineNumbers');
const submitBtn = document.getElementById('submitBtn');
const charCountSpan = document.getElementById('charCount');
const lineCountSpan = document.getElementById('lineCount');
const syntaxOverlay = document.getElementById('syntaxOverlay');
const highlightedCode = document.getElementById('highlightedCode');
const languageSelect = document.getElementById('language');
const detectedLangDisplay = document.getElementById('detectedLangDisplay');
const detectedLanguageHint = document.getElementById('detectedLanguageHint');
const MIN_CHARS = 50;
const CONFIDENCE_THRESHOLD = 50;

const languagePatterns = {
    python: {
        patterns: [
            /def\s+\w+\s*\(/,
                           /import\s+\w+/,
                           /from\s+\w+\s+import/,
                           /class\s+\w+:/,
                           /if\s+__name__\s*==\s*['"]__main__['"]/,
                           /print\s*\(/,
                                      /:\s*$/m,
                                      /@\w+/,
                                      /yield\s+/
        ],
        keywords: ['def', 'import', 'from', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'return', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'self', '__init__']
    },
    java: {
        patterns: [
            /public\s+class\s+\w+/,
            /public\s+static\s+void\s+main/,
            /System\.out\.println/,
            /import\s+java\./,
            /@Override/,
            /private\s+\w+\s+\w+;/,
            /protected\s+\w+\s+\w+;/,
            /new\s+\w+\(\)/,
                                      /interface\s+\w+/,
                                      /extends\s+\w+/
        ],
        keywords: ['public', 'private', 'protected', 'class', 'static', 'void', 'main', 'extends', 'implements', 'interface', 'abstract', 'final', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this', 'super', 'true', 'false', 'null', 'String', 'System']
    },
    c: {
        patterns: [
            /#include\s+[<"]/,
            /int\s+main\s*\(/,
                            /printf\s*\(/,
                                        /scanf\s*\(/,
                                                   /malloc\s*\(/,
                                                               /free\s*\(/,
                                                                         /struct\s+\w+\s*{/,
                                                                             /typedef\s+/,
                                                                             /->/,
                                                                             /\.h\b/,
                                                                             /NULL\b/,
                                                                             /#define\s+/
        ],
        keywords: ['#include', 'int', 'char', 'float', 'double', 'void', 'struct', 'typedef', 'enum', 'union', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'sizeof', 'NULL', 'malloc', 'free', 'printf', 'scanf', 'main', 'const']
                                                                         },
                                                                         cpp: {
                                                                             patterns: [
                                                                                 /#include\s+[<"]/,
                                                                                 /using\s+namespace\s+\w+/,
                                                                                 /int\s+main\s*\(/,
                                                                                                 /std::/,
                                                                                                 /cout\s*<</,
                                                                                                 /cin\s*>>/,
                                                                                                 /->/,
                                                                                                 /::/,
                                                                                                 /template\s*</,
                                                                                                 /class\s+\w+\s*{/,
                                                                                                     /public:\s*$/m,
                                                                                                     /private:\s*$/m,
                                                                                                     /protected:\s*$/m,
                                                                                                     /new\s+\w+\(\)/,
                                                                                                 /delete\s+/
                                                                             ],
                                                                             keywords: ['#include', 'using', 'namespace', 'class', 'public', 'private', 'protected', 'virtual', 'override', 'const', 'static', 'template', 'typename', 'friend', 'operator', 'new', 'delete', 'true', 'false', 'nullptr', 'std', 'cout', 'cin', 'endl', 'vector', 'string']
                                                                                                 }
                                                                         };

                                                                         let currentTheme = 'dark';

                                                                         function detectLanguage(code) {
                                                                             if (!code || code.trim().length === 0) {
                                                                                 return { language: 'auto', confidence: 0, detected: false };
                                                                             }

                                                                             const scores = {};

                                                                             for (const [lang, langData] of Object.entries(languagePatterns)) {
                                                                                 let score = 0;

                                                                                 for (const pattern of langData.patterns) {
                                                                                     if (pattern.test(code)) {
                                                                                         score += 2;
                                                                                     }
                                                                                 }

                                                                                 for (const keyword of langData.keywords) {
                                                                                     const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                                                                                     if (regex.test(code)) {
                                                                                         score += 1;
                                                                                     }
                                                                                 }

                                                                                 if (lang === 'python' && code.includes('def ') && code.includes(':')) {
                                                                                     score += 3;
                                                                                 }
                                                                                 if (lang === 'java' && code.includes('public class') && code.includes('System.out')) {
                                                                                     score += 3;
                                                                                 }
                                                                                 if (lang === 'c' && code.includes('#include') && (code.includes('printf') || code.includes('scanf'))) {
                                                                                     score += 3;
                                                                                 }
                                                                                 if (lang === 'cpp' && (code.includes('cout') || code.includes('cin')) && code.includes('std::')) {
                                                                                     score += 3;
                                                                                 }

                                                                                 scores[lang] = score;
                                                                             }

                                                                             let bestLang = 'auto';
                                                                             let bestScore = 0;

                                                                             for (const [lang, score] of Object.entries(scores)) {
                                                                                 if (score > bestScore) {
                                                                                     bestScore = score;
                                                                                     bestLang = lang;
                                                                                 }
                                                                             }

                                                                             const confidence = Math.min(100, Math.floor((bestScore / 20) * 100));
                                                                             const detected = confidence >= CONFIDENCE_THRESHOLD;

                                                                             return {
                                                                                 language: detected ? bestLang : 'auto',
                                                                                 confidence: confidence,
                                                                                 detected: detected
                                                                             };
                                                                         }

                                                                         function getLanguageDisplayName(lang) {
                                                                             const names = {
                                                                                 'auto': 'авто',
                                                                                 'python': 'Python',
                                                                                 'java': 'Java',
                                                                                 'c': 'C',
                                                                                 'cpp': 'C++'
                                                                             };
                                                                             return names[lang] || lang;
                                                                         }

                                                                         function toggleTheme() {
                                                                             currentTheme = currentTheme === 'dark' ? 'light' : 'dark';

                                                                             if (currentTheme === 'light') {
                                                                                 document.body.classList.add('light-theme');
                                                                                 document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '☀️';
                                                                                 const highlightTheme = document.getElementById('highlight-theme');
                                                                                 if (highlightTheme) {
                                                                                     highlightTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
                                                                                 }
                                                                             } else {
                                                                                 document.body.classList.remove('light-theme');
                                                                                 document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '🌙';
                                                                                 const highlightTheme = document.getElementById('highlight-theme');
                                                                                 if (highlightTheme) {
                                                                                     highlightTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
                                                                                 }
                                                                             }

                                                                             localStorage.setItem('theme', currentTheme);
                                                                             updateSyntaxHighlight();
                                                                         }

                                                                         function loadSavedSettings() {
                                                                             const savedTheme = localStorage.getItem('theme');
                                                                             if (savedTheme && savedTheme !== currentTheme) {
                                                                                 toggleTheme();
                                                                             }
                                                                         }

                                                                         function updateDetectedLanguageDisplay() {
                                                                             const code = textarea.value;
                                                                             const isAutoMode = languageSelect.value === 'auto';

                                                                             if (isAutoMode && code.trim().length > 20) {
                                                                                 const detection = detectLanguage(code);

                                                                                 if (detection.detected) {
                                                                                     const langName = getLanguageDisplayName(detection.language);
                                                                                     detectedLangDisplay.innerHTML = `$ определен: ${langName}`;
                                                                                     detectedLangDisplay.style.color = '#5EB2DB';

                                                                                     if (detectedLanguageHint) {
                                                                                         detectedLanguageHint.innerHTML = `# определен язык: ${langName}`;
                                                                                         detectedLanguageHint.style.color = '#5EB2DB';
                                                                                         detectedLanguageHint.style.background = 'rgba(94, 178, 219, 0.1)';
                                                                                     }
                                                                                 } else {
                                                                                     detectedLangDisplay.innerHTML = `$ определен: не определен`;
                                                                                     detectedLangDisplay.style.color = '#AE65DB';

                                                                                     if (detectedLanguageHint) {
                                                                                         detectedLanguageHint.innerHTML = '# язык не определен (попробуйте выбрать вручную)';
                                                                                         detectedLanguageHint.style.color = '#AE65DB';
                                                                                         detectedLanguageHint.style.background = 'rgba(174, 101, 219, 0.1)';
                                                                                     }
                                                                                 }
                                                                             } else if (!isAutoMode) {
                                                                                 const selectedLang = languageSelect.value;
                                                                                 const langName = getLanguageDisplayName(selectedLang);
                                                                                 detectedLangDisplay.innerHTML = `$ выбран: ${langName}`;
                                                                                 detectedLangDisplay.style.color = '#5E8ADB';

                                                                                 if (detectedLanguageHint) {
                                                                                     detectedLanguageHint.innerHTML = `# выбран язык: ${langName}`;
                                                                                     detectedLanguageHint.style.color = '#5E8ADB';
                                                                                     detectedLanguageHint.style.background = 'rgba(94, 138, 219, 0.1)';
                                                                                 }
                                                                             } else {
                                                                                 detectedLangDisplay.innerHTML = `$ определен: —`;
                                                                                 detectedLangDisplay.style.color = '#5a6e8a';

                                                                                 if (detectedLanguageHint) {
                                                                                     detectedLanguageHint.innerHTML = '# введите код для автоопределения языка';
                                                                                     detectedLanguageHint.style.color = '#5a6e8a';
                                                                                     detectedLanguageHint.style.background = 'transparent';
                                                                                 }
                                                                             }
                                                                         }

                                                                         function updateSyntaxHighlight() {
                                                                             const code = textarea.value;
                                                                             let language = languageSelect.value;
                                                                             const isAutoMode = language === 'auto';

                                                                             if (isAutoMode && code.trim().length > 20) {
                                                                                 const detection = detectLanguage(code);
                                                                                 if (detection.detected) {
                                                                                     language = detection.language;
                                                                                 }
                                                                             }

                                                                             if (code.trim() === '') {
                                                                                 if (highlightedCode) {
                                                                                     highlightedCode.innerHTML = '';
                                                                                     syntaxOverlay.style.opacity = '0';
                                                                                 }
                                                                                 return;
                                                                             }

                                                                             try {
                                                                                 const langMap = {
                                                                                     'python': 'python',
                                                                                     'java': 'java',
                                                                                     'c': 'c',
                                                                                     'cpp': 'cpp'
                                                                                 };

                                                                                 const lang = langMap[language] || 'plaintext';

                                                                                 let highlighted;
                                                                                 if (lang !== 'plaintext' && hljs.getLanguage(lang)) {
                                                                                     highlighted = hljs.highlight(code, { language: lang }).value;
                                                                                 } else {
                                                                                     highlighted = hljs.highlightAuto(code).value;
                                                                                 }

                                                                                 highlighted = highlighted.split('\n').map(line => line || ' ').join('\n');

                                                                                 if (highlightedCode) {
                                                                                     highlightedCode.innerHTML = highlighted;
                                                                                     syntaxOverlay.style.opacity = '1';
                                                                                 }

                                                                                 syncOverlayHeight();

                                                                             } catch (e) {
                                                                                 console.error('Syntax highlight error:', e);
                                                                                 if (highlightedCode) {
                                                                                     highlightedCode.textContent = code;
                                                                                     syntaxOverlay.style.opacity = '0.8';
                                                                                 }
                                                                             }
                                                                         }

                                                                         function countNonEmptyChars(text) {
                                                                             return text.split('\n').filter(line => line.trim().length > 0).join('').length;
                                                                         }

                                                                         function updateLineNumbers() {
                                                                             const lines = textarea.value.split('\n');
                                                                             const lineCount = lines.length;

                                                                             let lineNumbersHtml = '';
                                                                             for (let i = 1; i <= lineCount; i++) {
                                                                                 lineNumbersHtml += `<div class="line-number">${i}</div>`;
                                                                             }
                                                                             lineNumbers.innerHTML = lineNumbersHtml;

                                                                             lineNumbers.scrollTop = textarea.scrollTop;
                                                                             if (syntaxOverlay) {
                                                                                 syntaxOverlay.scrollTop = textarea.scrollTop;
                                                                             }

                                                                             lineCountSpan.innerHTML = `$ строк: ${lineCount}`;
                                                                         }

                                                                         function updateButtonState() {
                                                                             const text = textarea.value;
                                                                             const nonEmptyChars = countNonEmptyChars(text);
                                                                             const isValid = nonEmptyChars >= MIN_CHARS;

                                                                             if (isValid) {
                                                                                 submitBtn.disabled = false;
                                                                                 submitBtn.classList.add('active');
                                                                                 charCountSpan.style.color = '#5E8ADB';
                                                                                 charCountSpan.innerHTML = `$ символов: ${nonEmptyChars} ✓`;
                                                                             } else {
                                                                                 submitBtn.disabled = true;
                                                                                 submitBtn.classList.remove('active');
                                                                                 charCountSpan.style.color = '#AE65DB';
                                                                                 const needMore = MIN_CHARS - nonEmptyChars;
                                                                                 charCountSpan.innerHTML = `$ символов: ${nonEmptyChars}/${MIN_CHARS} (нужно еще ${needMore})`;
                                                                             }
                                                                         }

                                                                         function updateMetrics() {
                                                                             updateLineNumbers();
                                                                             updateButtonState();
                                                                             updateDetectedLanguageDisplay();
                                                                             updateSyntaxHighlight();
                                                                         }

                                                                         function typeWriterEffect(element, text, speed = 50) {
                                                                             let i = 0;
                                                                             element.textContent = '';
                                                                             const interval = setInterval(() => {
                                                                                 if (i < text.length) {
                                                                                     element.textContent += text[i];
                                                                                     i++;
                                                                                 } else {
                                                                                     clearInterval(interval);
                                                                                 }
                                                                             }, speed);
                                                                         }

                                                                         function initCustomSelect() {
                                                                             const selectWrapper = document.querySelector('.select-wrapper');
                                                                             if (selectWrapper) {
                                                                                 const select = selectWrapper.querySelector('select');
                                                                                 const arrow = selectWrapper.querySelector('.select-arrow');

                                                                                 select.addEventListener('focus', () => {
                                                                                     selectWrapper.classList.add('focused');
                                                                                 });

                                                                                 select.addEventListener('blur', () => {
                                                                                     selectWrapper.classList.remove('focused');
                                                                                 });

                                                                                 select.addEventListener('change', () => {
                                                                                     arrow.style.transform = 'rotate(180deg)';
                                                                                     setTimeout(() => {
                                                                                         arrow.style.transform = 'rotate(0deg)';
                                                                                     }, 300);
                                                                                     updateMetrics();
                                                                                 });
                                                                             }
                                                                         }

                                                                         function initButtonAnimation() {
                                                                             const btn = document.querySelector('.submit-btn');
                                                                             if (btn) {
                                                                                 btn.addEventListener('click', function(e) {
                                                                                     if (!this.disabled) {
                                                                                         this.style.transform = 'scale(0.98)';
                                                                                         setTimeout(() => {
                                                                                             this.style.transform = '';
                                                                                         }, 150);
                                                                                     }
                                                                                 });
                                                                             }
                                                                         }

                                                                         function initButtonTooltip() {
                                                                             if (submitBtn) {
                                                                                 submitBtn.addEventListener('mouseenter', function() {
                                                                                     if (this.disabled) {
                                                                                         const charCount = countNonEmptyChars(textarea.value);
                                                                                         const needMore = MIN_CHARS - charCount;
                                                                                         this.setAttribute('title', `Нужно еще ${needMore} символов для анализа`);
                                                                                     } else {
                                                                                         this.setAttribute('title', 'Нажми для проверки кода');
                                                                                     }
                                                                                 });
                                                                             }
                                                                         }

                                                                         function initFadeInAnimation() {
                                                                             document.querySelectorAll('.form-group, .submit-btn').forEach((el, i) => {
                                                                                 el.style.opacity = '0';
                                                                                 el.style.transform = 'translateY(20px)';
                                                                                 setTimeout(() => {
                                                                                     el.style.transition = 'all 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
                                                                                     el.style.opacity = '1';
                                                                                     el.style.transform = 'translateY(0)';
                                                                                 }, i * 100);
                                                                             });
                                                                         }

                                                                         function initResizeObserver() {
                                                                             if (textarea && syntaxOverlay) {
                                                                                 const resizeObserver = new ResizeObserver(() => {
                                                                                     syncOverlayHeight();
                                                                                 });
                                                                                 resizeObserver.observe(textarea);

                                                                                 window.addEventListener('resize', () => {
                                                                                     syncOverlayHeight();
                                                                                 });
                                                                             }
                                                                         }

                                                                         function syncOverlayHeight() {
                                                                             if (syntaxOverlay && textarea) {
                                                                                 syntaxOverlay.style.height = textarea.clientHeight + 'px';
                                                                                 syntaxOverlay.style.width = textarea.clientWidth + 'px';
                                                                             }
                                                                         }

                                                                         function initHtmxHandlers() {
                                                                             document.body.addEventListener('htmx:responseError', function(evt) {
                                                                                 const resultDiv = document.getElementById('result');
                                                                                 if (resultDiv) {
                                                                                     resultDiv.innerHTML = `
                                                                                     <div class="result-error">
                                                                                     <div class="error-prompt">$ error: 0x${Math.floor(Math.random() * 10000).toString(16)}</div>
                                                                                     <div class="error-icon">✖</div>
                                                                                     <div class="error-title">[connection_failed]</div>
                                                                                     <div class="error-message">${evt.detail.xhr.responseText || 'сервер не отвечает :('}</div>
                                                                                     </div>
                                                                                     `;
                                                                                 }
                                                                             });

                                                                             document.body.addEventListener('htmx:beforeRequest', function() {
                                                                                 const resultDiv = document.getElementById('result');
                                                                                 if (resultDiv && !resultDiv.querySelector('.result-loading')) {
                                                                                     resultDiv.innerHTML = `
                                                                                     <div class="result-loading">
                                                                                     <div class="loading-pulse"></div>
                                                                                     <div class="loading-prompt">$ analyzing...</div>
                                                                                     <div class="loading-text">[сканирование кода]</div>
                                                                                     <div class="loading-sub">> нейросеть думает...</div>
                                                                                     </div>
                                                                                     `;
                                                                                 }
                                                                             });

                                                                             document.querySelector('form').addEventListener('htmx:validation:validate', function(evt) {
                                                                                 const code = document.getElementById('code').value;
                                                                                 const nonEmptyChars = countNonEmptyChars(code);

                                                                                 if (nonEmptyChars < MIN_CHARS) {
                                                                                     evt.detail.errors.push('Код слишком короткий');
                                                                                     const resultDiv = document.getElementById('result');
                                                                                     resultDiv.innerHTML = `
                                                                                     <div class="result-error">
                                                                                     <div class="error-prompt">$ validation_error</div>
                                                                                     <div class="error-icon">⚠</div>
                                                                                     <div class="error-title">[input_too_short]</div>
                                                                                     <div class="error-message">требуется еще ${MIN_CHARS - nonEmptyChars} символов для анализа</div>
                                                                                     <div class="error-hint">> минимальная длина: ${MIN_CHARS} символов (сейчас: ${nonEmptyChars})</div>
                                                                                     </div>
                                                                                     `;
                                                                                     evt.preventDefault();
                                                                                 }
                                                                             });
                                                                         }

                                                                         // Инициализация при загрузке DOM
                                                                         document.addEventListener('DOMContentLoaded', () => {
                                                                             hljs.configure({
                                                                                 ignoreUnescapedHTML: true,
                                                                                 throwUnescapedHTML: false
                                                                             });

                                                                             if (textarea) {
                                                                                 textarea.addEventListener('input', updateMetrics);
                                                                                 textarea.addEventListener('scroll', () => {
                                                                                     lineNumbers.scrollTop = textarea.scrollTop;
                                                                                     if (syntaxOverlay) {
                                                                                         syntaxOverlay.scrollTop = textarea.scrollTop;
                                                                                     }
                                                                                 });
                                                                                 updateMetrics();
                                                                             }

                                                                             const promptText = document.querySelector('.prompt-text');
                                                                             if (promptText) {
                                                                                 const originalText = promptText.textContent;
                                                                                 typeWriterEffect(promptText, originalText, 50);
                                                                             }

                                                                             initCustomSelect();
                                                                             initButtonAnimation();
                                                                             initButtonTooltip();
                                                                             initFadeInAnimation();
                                                                             initHtmxHandlers();
                                                                             initResizeObserver();

                                                                             const themeToggle = document.getElementById('themeToggle');
                                                                             if (themeToggle) {
                                                                                 themeToggle.addEventListener('click', toggleTheme);
                                                                             }

                                                                             loadSavedSettings();
                                                                         });
