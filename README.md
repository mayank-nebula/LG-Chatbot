Fuzzy Matching Criteria:
Evaluate each source using these fuzzy membership functions (0.0 = no match, 1.0 = perfect match):

1. Semantic Similarity (0.0-1.0): How closely the meaning and concepts align
2. Lexical Overlap (0.0-1.0): Degree of shared keywords, phrases, and terminology
3. Contextual Relevance (0.0-1.0): How well the source context supports the answer's claims
4. Specificity Match (0.0-1.0): Level of detail correspondence between source and answer

Fuzzy Logic Process:
- Calculate fuzzy scores for each criterion per source
- Apply weighted aggregation (Semantic: 0.4, Lexical: 0.3, Contextual: 0.2, Specificity: 0.1)
- Sources with aggregate fuzzy scores ≥ 0.6 are considered matches
- Return ALL matching sources
