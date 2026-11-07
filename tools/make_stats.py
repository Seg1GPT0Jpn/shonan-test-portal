#!/usr/bin/env python3
"""Googleフォームの回答CSVから、公開用の集計（個人が分からない形）を作る。

使い方:
  python3 tools/make_stats.py 回答.csv > data/stats.json

・出力には平均・標準偏差・10点刻み（合計は100点刻み）の人数だけを入れ、
  ニックネームや出席番号などの個人の行は一切含めない。
・回答が config.json の minN 人未満の科目は出力しない（少人数だと個人が推定できるため）。
・同じ出席番号・同じ試験の回答が複数ある場合は、最後の回答だけを使う。
"""
import csv, json, sys, statistics, datetime

SUBJECTS = ["現代の国語", "言語文化", "数学Ⅰ", "数学A", "化学基礎", "生物基礎", "ECⅠ", "論表Ⅰ", "地理総合", "公共", "情報Ⅰ"]
cfg = json.load(open("data/config.json", encoding="utf-8"))
MIN_N = cfg.get("minN", 10)

rows = list(csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")))
latest = {}
for r in rows:
    key = (r.get("出席番号（4桁）", "").strip(), r.get("試験", "").strip())
    if key[0] and key[1]:
        latest[key] = r  # 後の回答で上書き

exams = {}
for (_, exam), r in latest.items():
    e = exams.setdefault(exam, {s: [] for s in SUBJECTS + ["合計"]})
    total, full = 0, True
    for s in SUBJECTS:
        v = (r.get(s) or "").strip()
        if v == "":
            full = False
            continue
        try:
            x = float(v)
        except ValueError:
            full = False
            continue
        if 0 <= x <= 100:
            e[s].append(x)
            total += x
        else:
            full = False
    if full:
        e["合計"].append(total)

out = {"updated": datetime.date.today().isoformat(), "exams": []}
for exam, subs in exams.items():
    ex = {"exam": exam, "subjects": []}
    for s, xs in subs.items():
        if len(xs) < MIN_N:
            continue
        top = 1100 if s == "合計" else 100
        step = 100 if s == "合計" else 10
        bins = [{"from": a, "to": a + step, "count": sum(1 for x in xs if a <= x < a + step or (a + step == top and x == top))} for a in range(0, top, step)]
        ex["subjects"].append({"subject": s, "n": len(xs), "mean": round(statistics.mean(xs), 1),
                               "sd": round(statistics.pstdev(xs), 1), "top": top, "bins": bins})
    if ex["subjects"]:
        out["exams"].append(ex)
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
