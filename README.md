document.addEventListener("DOMContentLoaded", function () {
    document
        .getElementById("topic-form")
        .addEventListener("submit", async function (event) {
            event.preventDefault();
            const topic = document.getElementById("topic").value;
            const resultDiv = document.getElementById("result");
            let result = "";
            let sources = "";
            let chatId = "";

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
                    console.log(chunk)
                    const parts = chunk.split('}{').map((part, index, array) => {
                        if (index === 0) return part + '}';
                        if (index === array.length - 1) return '{' + part;
                        return '{' + part + '}';
                    })


                    parts.forEach(part => {
                        const parsed = JSON.parse(part);
                        if (parsed.type === "text") {
                            result += parsed.content;
                        } else if (parsed.type === "sources") {
                            sources = parsed.content;
                        } else {
                            chatId = parsed.content;
                        }
                    })

                    resultDiv.innerHTML = marked.parse(result);
                }

                console.log("Chat ID:", chatId);
                console.log("Sources:", sources);

            } catch (error) {
                console.error('Error:', error);
            }
        });
});
