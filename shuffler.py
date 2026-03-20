import random
import os

def shuffle_quiz_file(input_file, output_file):
    if not os.path.exists(input_file):
        print(f"❌ خطأ: ملف {input_file} مش موجود في الفولدر!")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    shuffled_lines = []
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        parts = line.split('|')
        
        # التأكد إن السطر سليم وفيه 9 أجزاء (من 0 لـ 8)
        if len(parts) == 9:
            tag = parts[0]
            level = parts[1]
            question = parts[2]
            options = parts[3:7]  # الاختيارات من الفهرس 3 لـ 6
            correct_idx = int(parts[7]) - 1 # الإجابة القديمة
            category = parts[8]

            # 1. حفظ نص الإجابة الصحيحة قبل الشقلبة
            correct_answer_text = options[correct_idx]

            # 2. شقلبة الاختيارات عشوائياً
            random.shuffle(options)

            # 3. معرفة المكان الجديد للإجابة الصحيحة
            new_correct_idx = options.index(correct_answer_text) + 1

            # 4. بناء السطر الجديد بنفس التنسيق
            new_line = f"{tag}|{level}|{question}|{'|'.join(options)}|{new_correct_idx}|{category}"
            shuffled_lines.append(new_line)
        else:
            # لو سطر مش ماشي مع النظام سيبه زي ما هو
            shuffled_lines.append(line)

    # حفظ النتيجة في ملف جديد
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(shuffled_lines))
    
    print(f"✅ تم بنجاح! الملف المتشقلب جاهز هنا: {output_file}")

# تشغيل الأداة
if __name__ == "__main__":
    # حط هنا اسم الملف بتاعك اللي فيه الأسئلة الخام
    shuffle_quiz_file('raw_questions.txt', 'final_questions.txt')
    # ... (نفس الكود اللي فات) ...

if __name__ == "__main__":
    input_file = 'raw_questions.txt'
    output_file = 'temp_shuffled.txt'
    
    # تشغيل الشقلبة
    shuffle_quiz_file(input_file, output_file)
    
    # حركة ذكية: حذف القديم وتسمية الجديد مكانه فوراً
    if os.path.exists(output_file):
        os.remove(input_file) # مسح الملف الخام
        os.rename(output_file, input_file) # تحويل المتشقلب ليكون هو الملف الأساسي
        print(f"🚀 تم التحديث! ملف {input_file} الآن يحتوي على أسئلة متشقلبة وجاهزة.")
        