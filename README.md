<!DOCTYPE html>
<html>
<head>
    <title>Markdown Generator</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
    <h1>Markdown Generator</h1>
    <form id="topic-form">
        <label for="topic">Enter a topic:</label>
        <input type="text" id="topic" name="topic">
        <button type="submit">Generate</button>
    </form>
    <div id="result"></div>
    <script>
        document.getElementById("topic-form").addEventListener("submit", async function(event) {
            event.preventDefault();
            const topic = document.getElementById("topic").value;
            const response = await fetch(`http://localhost:6969/generate`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: topic })
            });
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            const resultDiv = document.getElementById("result");
            let result = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                result += decoder.decode(value);
                resultDiv.innerHTML = marked.parse(result);
            }
        });
    </script>
</body>
</html>
