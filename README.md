prompt = (
        "You are a professional video analyst. Given the list of segments with start, end, and detail, "
        "write a comprehensive summary of the whole video. "
        "Capture the storyline, key actions, spoken content, emotional flow, and overall meaning. "
        "Make it clear and concise, but detailed enough to understand the full video without watching it."
    )

    resp = await client.aio.models.generate_content(
        model=MODEL_ID,
        contents=[prompt, text_input],
        config=types.GenerateContentConfig(
            temperature=0.4,
            max_output_tokens=2048,
        ),
    )

    return resp.text
