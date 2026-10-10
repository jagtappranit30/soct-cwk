package com.nottsevents.repository;

import com.nottsevents.model.Student;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    Optional<Student> findByStudentId(String studentId);

    Optional<Student> findByEmailAndPassword(String email, String password);
}
