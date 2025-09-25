# CARA PEMAKAIAN:
1. Clone repo ini.
2. Delete ```.DS_STORE```.
3. Delete ```.git``` dari root project folder.
4. Rename nama root project folder.
5. Rename ```package.json```'s name & description di kedua sub-folder: api & web (optional).
6. Buat repo baru untuk kebutuhan tim (Salah 1 dari tim saja yang buat).
7. Invite new collaborator(teammate) ke repo yang sudah dibuat.
8. ```git init``` dari root project directory.
9. ```git add . -> git commit -m "build(init): init minpro" -> git branch -m main -> git push origin main```.
10. Khusus untuk invited collaborator: clone repo baru yang sudah dibuat. Jangan clone repo starter kit ini.
11. Khusus untuk pembuat repo: ```git pull``` dari main branch untuk re-sync.
12. Dalam masing-masing directory web & api, jalankan ```npm i``` untuk meng-install semua dependencies yang sudah ada.
13. Buat ```.env``` di masing-masing directory web & api. Untuk api, lihat ```.env.example```. Untuk web, lihat ```app.config.ts``` untuk keys apa saja yang perlu ditambahkan di ```.env``` masing-masing directory.
14. Jalankan ```npm run dev``` di masing-masing directory untuk test run.
15. Buat feature branch baru setiap development fitur baru, contoh: ```git checkout -b feat/api/auth```.
16. Untuk membuat backup di remote repo, lakukan push ke feature branch baru kalian setiap kalian commit.
17. Sering-sering commit untuk setiap checkpoint development, contoh: ```git commit -m "feat(api/auth): add new auth.controller.ts"```.
18. Setelah sebuah fitur sudah selesai push ke feature branch lalu lakukan pull request ke main branch.
19. Berikan penjelasan terhadap apa saja code changes yang dilakukan saat pull request.
20. Saling periksa pull request masing-masing & berikan komentar bila perlu.
21. Kalau sudah menemukan kesepakatan dari pull request yang dilakukan, lakukan confirm merge.
22. Periksa bila ada conflict. Kalau ada conflict ikuti arahan dari github untuk resolve dari github atau vscode.
23. Setelah fitur sudah di-merge ke main, masing-masing dari kalian misal masih in progress di feature branch boleh ```git pull origin main```, untuk sync feature branch kalian dengan main yang baru.
24. Untuk yang melakukan pull request, bisa kembali ke branch main local dengan git checkout main, lalu ```git pull``` untuk sync local branch dengan remote branch.
25. Setelah itu bisa buat feature branch baru untuk melakukan development fitur baru dari branch main yang sudah ter-update.
26. Salam sukses!
