import sys
import fitz

path = sys.argv[1]
out_prefix = sys.argv[2] if len(sys.argv) > 2 else path.rsplit(".", 1)[0]
doc = fitz.open(path)
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(2.2, 2.2))
    out = f"{out_prefix}_p{i+1}.png"
    pix.save(out)
    print(out)
