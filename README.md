document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("topic-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const topic = document.getElementById("topic").value;
        const resultDiv = document.getElementById("result");
        let result = "";
        let sources = "";
        let chatId = "";
        let accumulatedChunk = "";

        try {
            const response = await fetch("https://20.191.112.232/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question: topic }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                console.log("Chunk received:", chunk);
                accumulatedChunk += chunk;

                try {
                    // Try to parse the accumulated chunk
                    const parsed = JSON.parse(accumulatedChunk);
                    
                    if (parsed.type === "text") {
                        result += parsed.content;
                        resultDiv.innerHTML = marked.parse(result);
                    } else if (parsed.type === "sources") {
                        sources = parsed.content;
                    } else if (parsed.type === "chatId") {
                        chatId = parsed.content;
                    }

                    // Clear accumulated chunk after successful parse
                    accumulatedChunk = "";
                } catch (e) {
                    // If parsing fails, it means we haven't received a complete JSON object yet
                    console.log("Waiting for more chunks to form a complete JSON object");
                }
            }

            console.log("Chat ID:", chatId);
            console.log("Sources:", sources);

        } catch (error) {
            console.error('Error:', error);
        }
    });
});
