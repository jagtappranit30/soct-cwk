package com.nottsevents.service;

import com.nottsevents.model.Student;
import com.nottsevents.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class StudentService {

    private static final Logger logger = LoggerFactory.getLogger(StudentService.class);
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Student subscribeStudent(Student student) {
        // Optional: you could check if the studentId already exists here
        Optional<Student> existingStudent = studentRepository.findByStudentId(student.getStudentId());
        if (existingStudent.isPresent()) {
            throw new IllegalArgumentException("Student with ID " + student.getStudentId() + " is already registered.");
        }
        
        // Hash the password before saving
        student.setPassword(passwordEncoder.encode(student.getPassword()));
        
        return studentRepository.save(student);
    }

    public Student login(String studentId, String password) {
        logger.info("Attempting login for studentId: {}", studentId);
        Optional<Student> student = studentRepository.findByStudentId(studentId);
        
        if (student.isPresent()) {
            boolean matches = passwordEncoder.matches(password, student.get().getPassword());
            if (matches) {
                logger.info("Login successful for studentId: {}", studentId);
                return student.get();
            } else {
                logger.warn("Login failed: password mismatch for studentId: {}", studentId);
            }
        } else {
            logger.warn("Login failed: studentId {} not found", studentId);
        }
        throw new IllegalArgumentException("Invalid student ID or password.");
    }
}
