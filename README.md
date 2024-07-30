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
    <input type="text" id="topic" name="topic" />
    <button type="submit">Generate</button>
  </form>
  <div id="result"></div>
  <script>
    document.getElementById("topic-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      const topic = document.getElementById("topic").value;
      const response = await fetch("http://localhost:8000/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: topic }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      const resultDiv = document.getElementById("result");
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        result += chunk;

        // Split the result into individual JSON objects
        const objects = result.split('\n').filter(obj => obj.trim().length > 0);
        result = ""; // Reset result to handle incomplete JSON objects

        // Process each JSON object
        objects.forEach(obj => {
          try {
            const parsedResponse = JSON.parse(obj);
            if (parsedResponse.type === "text") {
              resultDiv.innerHTML += marked.parse(parsedResponse.content);
            } else if (parsedResponse.type === "sources" || parsedResponse.type === "chatId") {
              console.log(`${parsedResponse.type}:`, parsedResponse.content);
            }
          } catch (e) {
            // Incomplete JSON object, add it back to the result
            result = obj;
          }
        });
      }
    });
  </script>
</body>
</html>
