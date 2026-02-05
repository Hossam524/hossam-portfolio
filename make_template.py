import csv

OUT = "questions_template.csv"

cats = [
    ("religion", "r"),
    ("general", "g"),
    ("logic", "l"),
    ("education", "e"),
]

# 250 لكل قسم = 1000
PER_CAT = 250

def level_for(i):
    # توزيع بسيط: 1 (سهل) 40% ، 2 (متوسط) 40% ، 3 (صعب) 20%
    if i <= 100:
        return 1
    if i <= 200:
        return 2
    return 3

with open(OUT, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id","cat","lvl","q","A","B","C","D","answer","explain"])

    for cat, prefix in cats:
        for i in range(1, PER_CAT + 1):
            qid = f"{prefix}{i:03d}"     # r001..r250
            lvl = level_for(i)
            # نسيب السؤال والاختيارات فاضية عشان تملأهم في الشيت
            w.writerow([qid, cat, lvl, "", "", "", "", "", "", ""])

print(f"Done -> {OUT} (1000 rows)")