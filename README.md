numeric_slides = sorted(
    [(slide, summaries) for slide, summaries in summaries_by_slide.items() if re.match(r'\D*\d+', slide)], 
    key=lambda x: extract_slide_number(x[0])
)
non_numeric_slides = sorted(
    [(slide, summaries) for slide, summaries in summaries_by_slide.items() if not re.match(r'\D*\d+', slide)]
)

# Combine summaries in the sorted order
combined_summary = '\n'.join(f"{slide}: {' '.join(summaries)}" for slide, summaries in numeric_slides + non_numeric_slides)

# Print the combined summary
print(combined_summary)
