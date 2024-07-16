def extract_slide_number(slide):
    match = re.search(r'\d+', slide)
    return int(match.group()) if match else float('inf')

# Sort the slides based on their numerical order
sorted_slides = sorted(summaries_by_slide.items(), key=lambda x: extract_slide_number(x[0]))

# Combine summaries in the sorted order
combined_summary = '\n'.join(f"{slide}: {' '.join(summaries)}" for slide, summaries in sorted_slides)

# Print the combined summary
print(combined_summary)
