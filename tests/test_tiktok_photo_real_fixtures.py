"""Linux real-format input/ZIP tests. Pillow creates fixtures, not browser canvas output."""
import io,json,subprocess,tempfile,unittest,zipfile
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BATCH=(ROOT/'automation/sns_auto_posting/tiktok/photo/batch.mjs').as_uri()
class RealFixtures(unittest.TestCase):
 def test_real_jpeg_png_webp_headers_and_exif_fixture(self):
  with tempfile.TemporaryDirectory() as d:
   files=[]
   for fmt,mime in [('JPEG','image/jpeg'),('PNG','image/png'),('WEBP','image/webp')]:
    p=Path(d)/fmt;im=Image.new('RGB',(80,40),'red');im.save(p,format=fmt);files.append([str(p),mime])
   p=Path(d)/'rotated.jpg';exif=Image.Exif();exif[274]=6;Image.new('RGB',(80,40),'blue').save(p,exif=exif);files.append([str(p),'image/jpeg'])
   with Image.open(p) as im: self.assertEqual(im.getexif()[274],6)
   code=f"import fs from 'node:fs';import {{headerDimensions}} from {json.dumps(BATCH)};console.log(JSON.stringify({json.dumps(files)}.map(([p,t])=>headerDimensions(new Uint8Array(fs.readFileSync(p)),t))));"
   r=subprocess.run(['node','--input-type=module','-e',code],check=True,capture_output=True,text=True)
   self.assertEqual(json.loads(r.stdout),[{'w':80,'h':40}]*4)
 def test_application_zip_preserves_actual_jpeg_bytes_order_and_dimensions(self):
  with tempfile.TemporaryDirectory() as d:
   paths=[];sizes=[(900,1200),(1200,900),(1600,900)]
   for i,size in enumerate(sizes):
    p=Path(d)/f'{i}.jpg';Image.new('RGB',size,['red','green','blue'][i]).save(p,quality=92);paths.append(str(p))
   out=Path(d)/'photos.zip'
   code=f"import fs from 'node:fs';import {{zip,filename}} from {json.dumps(BATCH)};const p={json.dumps(paths)};const b=await zip(p.map((p,i)=>({{name:filename(i),blob:new Blob([fs.readFileSync(p)])}})));fs.writeFileSync({json.dumps(str(out))},new Uint8Array(await b.arrayBuffer()));"
   subprocess.run(['node','--input-type=module','-e',code],check=True,capture_output=True,text=True)
   with zipfile.ZipFile(out) as z:
    self.assertIsNone(z.testzip());self.assertEqual(z.namelist(),[f'FieldRise_TikTok_{i+1:03}.jpg' for i in range(3)])
    for i,n in enumerate(z.namelist()):
     raw=z.read(n);self.assertEqual(raw,Path(paths[i]).read_bytes());
     with Image.open(io.BytesIO(raw)) as im: im.load();self.assertEqual(im.size,sizes[i])
 def test_three_portrait_jpegs_zip_exact_900_by_1200(self):
  with tempfile.TemporaryDirectory() as d:
   paths=[];sizes=[(900,1200)]*3
   for i,size in enumerate(sizes):
    p=Path(d)/f'{i}.jpg';Image.new('RGB',size,['red','green','blue'][i]).save(p,quality=92);paths.append(str(p))
   out=Path(d)/'photos.zip'
   code=f"import fs from 'node:fs';import {{zip,filename}} from {json.dumps(BATCH)};const p={json.dumps(paths)};const b=await zip(p.map((p,i)=>({{name:filename(i),blob:new Blob([fs.readFileSync(p)])}})));fs.writeFileSync({json.dumps(str(out))},new Uint8Array(await b.arrayBuffer()));"
   subprocess.run(['node','--input-type=module','-e',code],check=True,capture_output=True,text=True)
   with zipfile.ZipFile(out) as z:
    self.assertIsNone(z.testzip());self.assertEqual(z.namelist(),[f'FieldRise_TikTok_{i+1:03}.jpg' for i in range(3)])
    for i,n in enumerate(z.namelist()):
     raw=z.read(n);self.assertEqual(raw,Path(paths[i]).read_bytes());
     with Image.open(io.BytesIO(raw)) as im: im.load();self.assertEqual(im.size,sizes[i])
