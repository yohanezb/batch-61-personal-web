// Data awal: Array of Object
var students = [
    { name: "Andi", score: 88 },
    { name: "Budi", score: 74 },
    { name: "Citra", score: 95 }
  ];
  
  // Fungsi untuk menambahkan mahasiswa baru
  function addStudent(name, score) {
    students.push({ name: name, score: score });
  }
  
  // Fungsi untuk menampilkan semua data dengan status kelulusan
  function showStudents() {
    console.log("== Daftar Mahasiswa ==");
    for (var i = 0; i < students.length; i++) {
      var student = students[i];
      var status = student.score >= 75 ? "Lulus" : "Tidak Lulus";
      console.log((i + 1) + ". " + student.name + " - Nilai: " + student.score + " - " + status);
    }
  }
  
  // Fungsi untuk menghitung rata-rata nilai
  function averageScore() {
    var total = 0;
    for (var i = 0; i < students.length; i++) {
      total += students[i].score;
    }
    return total / students.length;
  }
  
  // Tambahkan mahasiswa baru
  addStudent("Dina", 68);
  addStudent("Eko", 90);
  
  // Tampilkan hasil
  showStudents();
  
  console.log("\nRata-rata nilai: " + averageScore().toFixed(2));
  