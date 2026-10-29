import fitz  # PyMuPDF
import spacy
import re

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")


# Common technical skills
SKILLS = [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "HTML",
    "CSS",
    "SQL",
    "Machine Learning",
    "Deep Learning",
    "Artificial Intelligence",
    "NLP",
    "Data Analysis",
    "Git",
    "GitHub",
    "FastAPI",
    "Flask",
    "Django",
    "C",
    "C++",
    "TypeScript",
    "Node.js",
    "MongoDB",
    "MySQL",
    "PostgreSQL",
]


def extract_text_from_pdf(pdf_path):
    """Extract text from all pages of a PDF using PyMuPDF."""

    document = fitz.open(pdf_path)
    full_text = ""

    for page in document:
        page_text = page.get_text()
        full_text += page_text + "\n"

    document.close()
    return full_text.strip()


def extract_skills(text):
    """Identify technical skills mentioned in the resume."""

    found_skills = []

    for skill in SKILLS:
        # Match complete skills and avoid false matches
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"

        if re.search(pattern, text, re.IGNORECASE):
            found_skills.append(skill)

    return found_skills


def detect_sections(text):
    """Detect important resume sections."""

    sections = {
        "education": False,
        "experience": False,
        "projects": False,
        "certifications": False,
    }

    if re.search(
        r"\beducation\b|\buniversity\b|\bcollege\b|\bb\.?\s?tech\b|\bbachelor\b|\bdegree\b",
        text,
        re.IGNORECASE,
    ):
        sections["education"] = True

    if re.search(
        r"\bexperience\b|\binternship\b|\bintern\b|\bemployment\b",
        text,
        re.IGNORECASE,
    ):
        sections["experience"] = True

    if re.search(
        r"\bprojects?\b|\bdeveloped\b|\bbuilt\b|\bcreated\b|\bimplemented\b",
        text,
        re.IGNORECASE,
    ):
        sections["projects"] = True

    if re.search(
        r"\bcertifications?\b|\bcertificates?\b|\bcertified\b|\bcourse\b|\btraining\b",
        text,
        re.IGNORECASE,
    ):
        sections["certifications"] = True

    return sections


def extract_entities(text):
    """Use spaCy NLP to identify named entities."""

    doc = nlp(text)
    entities = []

    for entity in doc.ents:
        entities.append({
            "text": entity.text,
            "label": entity.label_,
        })

    return entities


def analyze_resume(pdf_path):
    """Complete Resume Intelligence analysis."""

    # Step 1: Extract PDF text
    text = extract_text_from_pdf(pdf_path)

    # Step 2: Extract skills
    skills = extract_skills(text)

    # Step 3: Detect resume sections
    sections = detect_sections(text)

    # Step 4: Extract NLP entities
    entities = extract_entities(text)

    return {
        "text": text,
        "skills": skills,
        "sections": sections,
        "entities": entities,
    }


# -----------------------------------------
# TEST
# -----------------------------------------

if __name__ == "__main__":

    print("\n===================================")
    print("      CARA RESUME INTELLIGENCE")
    print("===================================\n")

    pdf_path = input("Enter the path of your resume PDF: ").strip('"')

    try:
        result = analyze_resume(pdf_path)

        print("\n----- SKILLS FOUND -----")
        if result["skills"]:
            for skill in result["skills"]:
                print("✓", skill)
        else:
            print("No skills detected.")

        print("\n----- SECTIONS -----")
        for section, found in result["sections"].items():
            status = "Found" if found else "Not Found"
            print(f"{section.title()}: {status}")

        print("\n----- NLP ENTITIES -----")
        if result["entities"]:
            for entity in result["entities"]:
                print(f"{entity['text']} → {entity['label']}")
        else:
            print("No named entities detected.")

        print("\n----- TEXT PREVIEW -----")
        print(result["text"][:1000])

        print("\n===================================")
        print("Analysis completed successfully.")
        print("===================================\n")

    except Exception as error:
        print("\nError while analyzing resume:")
        print(error)