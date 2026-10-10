package com.nottsevents.controller;

import com.nottsevents.model.Student;
import com.nottsevents.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    @Autowired
    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    // This method handles student registration (alias for subscribe)
    @PostMapping("/register")
    public ResponseEntity<?> registerStudent(@RequestBody Student student) {
        Student savedStudent = studentService.subscribeStudent(student);
        return new ResponseEntity<>(savedStudent, HttpStatus.CREATED);
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribeStudent(@RequestBody Student student) {
        return registerStudent(student);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String studentId = credentials.get("studentId");
        String password = credentials.get("password");
        if (studentId == null || password == null) {
            throw new IllegalArgumentException("Student ID and password are required.");
        }
        Student student = studentService.login(studentId, password);
        return new ResponseEntity<>(student, HttpStatus.OK);
    }
}
