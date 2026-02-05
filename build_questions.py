import csv, json, sys

INPUT = "questions.csv"
OUTPUT = "questions.js"

def norm_cat(s):
    s = (s or "").strip().lower()
    mapping = {
        "dini":"religion", "religion":"religion", "ديني":"religion",
        "general":"general", "عام":"general", "معلومات عامة":"general",
        "logic":"logic", "ذكاء":"logic",
        "education":"education", "تعليم":"education",
    }
    return mapping.get(s, s)

def to_int(x, default=1):
    try:
        return int(str(x).strip())
    except:
        return default

def clean(s):
    return (s or "").strip()

rows = []
bad = 0

with open(INPUT, newline="", encoding="utf-8") as f:
    r = csv.DictReader(f)
    required_cols = {"cat","lvl","q","A","B","C","D","answer","explain"}
    if not required_cols.issubset(set(c.strip() for c in r.fieldnames or [])):
        print("❌ الأعمدة لازم تكون: cat,lvl,q,A,B,C,D,answer,explain")
        print("   العناوين الحالية:", r.fieldnames)
        sys.exit(1)

    for line, row in enumerate(r, start=2):
        cat = norm_cat(row.get("cat"))
        lvl = to_int(row.get("lvl"), 1)
        q = clean(row.get("q"))

        A = clean(row.get("A"))
        B = clean(row.get("B"))
        C = clean(row.get("C"))
        D = clean(row.get("D"))

        # لو حد حاطط الاختيارات في خانة واحدة مفصولة بفواصل
        if (not B and not C and not D) and (("," in A) or ("،" in A)):
            sep = "،" if "،" in A else ","
            parts = [p.strip() for p in A.split(sep) if p.strip()]
            if len(parts) >= 4:
                A, B, C, D = parts[:4]

        ans = to_int(row.get("answer"), 0)
        # لو الإجابة 1..4 نخليها 0..3
        if 1 <= ans <= 4:
            ans -= 1

        explain = clean(row.get("explain"))

        if not cat or not q or not all([A,B,C,D]) or not (0 <= ans <= 3):
            bad += 1
            continue

        rows.append({
            "cat": cat,
            "lvl": lvl,
            "q": q,
            "choices": [A,B,C,D],
            "answer": ans,
            "explain": explain
        })

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("window.QUESTION_BANK=")
    f.write(json.dumps(rows, ensure_ascii=False, separators=(",",":")))
    f.write(";")

# تقرير سريع
from collections import Counter
c = Counter([x["cat"] for x in rows])
print("✅ تم إنشاء questions.js")
print("عدد الأسئلة:", len(rows), "| صفوف مرفوضة:", bad)
print("توزيع الأقسام:", dict(c))