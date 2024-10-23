from fpdf import FPDF

# Create instance of FPDF class
pdf = FPDF()

# Add a page
pdf.add_page()

# Set title
pdf.set_font('Arial', 'B', 16)
pdf.cell(200, 10, 'Title of the PDF', ln=True, align='C')

# Add some text
pdf.set_font('Arial', '', 12)
pdf.cell(200, 10, 'This is a sample PDF created in a VM.', ln=True)

# Save the PDF
pdf.output("sample.pdf")

print("PDF created successfully!")
