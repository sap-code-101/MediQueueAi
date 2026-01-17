INSERT INTO doctors (id, name, available_slots) VALUES
(1, 'Dr. Smith', 10),
(2, 'Dr. Johnson', 8),
(3, 'Dr. Williams', 5);

INSERT INTO patients (id, name, booked_slots) VALUES
(1, 'Alice Brown', 1),
(2, 'Bob Davis', 2),
(3, 'Charlie Wilson', 1);

INSERT INTO appointments (id, patient_id, doctor_id, appointment_time) VALUES
(1, 1, 1, '2023-10-30 10:00:00'),
(2, 2, 2, '2023-10-30 11:00:00'),
(3, 3, 3, '2023-10-30 12:00:00');