export interface OathFormData {
  firstName: string
  lastName: string
  matricNumber: string
  program: string
  department: string
  oathDate: string
}

export function generateOathForm(data: OathFormData): string {
  const {
    firstName,
    lastName,
    matricNumber,
    program,
    department,
    oathDate
  } = data

  return `
CROSS COLLEGE OF HEALTH TECHNOLOGY
SCHOOL OATH FORM AND AGREEMENT

${oathDate}

STUDENT OATH AND PROFESSIONAL AGREEMENT

I, ${firstName} ${lastName}, with Matric Number ${matricNumber}, enrolled in the ${program} program, Department of ${department}, hereby solemnly declare and agree as follows:

PREAMBLE:
I understand that as a student of Cross College of Health Technology and a future healthcare professional, I am expected to uphold the highest standards of academic integrity, professional conduct, and ethical behavior. I acknowledge that this oath is a binding commitment that will guide my actions throughout my studies and beyond.

ACADEMIC INTEGRITY OATH:

1. I pledge to maintain absolute honesty in all academic endeavors. I will not engage in any form of cheating, plagiarism, or academic dishonesty.

2. I will complete all assignments, examinations, and projects on my own unless collaboration is explicitly authorized by the instructor.

3. I will properly cite all sources and give credit to the original authors of any work that I reference.

4. I will not use unauthorized materials during examinations or assessments.

5. I will not assist others in academic dishonesty or allow my work to be used for cheating.

6. I will report any instances of academic dishonesty that I witness to the appropriate authorities.

7. I understand that academic dishonesty undermines the integrity of the educational process and the healthcare profession.

ATTENDANCE AND PARTICIPATION OATH:

8. I commit to attending all classes, lectures, practical sessions, and clinical rotations regularly and punctually.

9. I will maintain the required attendance percentage as specified in the student handbook (75% for classes, 80% for practical sessions, 90% for clinical rotations).

10. I will notify my instructors in advance if I must miss a class due to illness or emergency, and provide appropriate documentation.

11. I will make up all missed work within the timeframe specified by my instructors.

12. I understand that poor attendance may result in academic penalties or dismissal from the program.

PROFESSIONAL CONDUCT OATH:

13. I agree to conduct myself with dignity, respect, and professionalism at all times, both on and off campus.

14. I will treat all college staff, fellow students, patients, and clinical staff with respect and courtesy.

15. I will not engage in any form of physical or verbal abuse, harassment, or discrimination against any member of the college community or patients.

16. I will maintain appropriate professional boundaries with patients, colleagues, and instructors.

17. I will dress appropriately and professionally as required by the college dress code, especially during clinical sessions.

18. I will represent Cross College of Health Technology with honor and integrity in all my interactions.

HEALTHCARE ETHICS OATH:

19. I pledge to maintain the highest ethical standards as a future healthcare professional.

20. I will strictly observe patient confidentiality and privacy at all times, in accordance with professional ethics and legal requirements.

21. I will obtain informed consent before performing any procedure on a patient.

22. I will provide care to all patients without discrimination based on race, religion, gender, age, or socioeconomic status.

23. I will practice within the scope of my training and seek guidance when uncertain.

24. I will report any errors or near-misses to my supervisors to ensure patient safety.

25. I will advocate for the rights and well-being of my patients.

26. I will maintain my professional competence through continuous learning and skill development.

FACILITY AND EQUIPMENT OATH:

27. I promise to use all college facilities, equipment, and resources responsibly and return them in good condition.

28. I will accept financial responsibility for any damage caused by my negligence or misuse of college property.

29. I will report any malfunctioning equipment or safety hazards immediately to the appropriate personnel.

30. I will not remove any college property, equipment, or materials without proper authorization.

31. I will keep my work areas clean and organized, following proper infection control protocols.

HEALTH AND SAFETY OATH:

32. I will comply with all health and safety regulations, especially during clinical sessions and laboratory work.

33. I will wear required personal protective equipment (PPE) at all times as specified by safety protocols.

34. I will follow proper infection control procedures to prevent the spread of infections.

35. I will report any injuries, accidents, or exposures immediately to the appropriate authorities.

36. I will not come to class or clinical settings if I am contagious or ill, to protect others.

37. I will maintain my personal health and well-being to ensure I can perform my duties effectively.

FINANCIAL OBLIGATIONS OATH:

38. I will pay all required fees by the stipulated deadlines.

39. I understand that failure to pay fees may result in penalties, denial of examination privileges, or dismissal from the program.

40. I will keep all payment receipts for my records.

41. I will promptly report any financial difficulties to the finance department to explore available options.

DISCIPLINARY OATH:

42. I will not engage in any form of physical or verbal abuse, harassment, or discrimination.

43. I will not use or possess any prohibited substances (alcohol, drugs, etc.) on college premises.

44. I will comply with all examination regulations and will not bring unauthorized materials into examination halls.

45. I will not engage in any form of examination malpractice.

46. I understand that violation of these rules may result in disciplinary action, including warnings, suspension, or expulsion.

47. I accept full responsibility for my actions and their consequences.

COMMUNICATION OATH:

48. I will regularly check my official email and the college portal for important communications.

49. I will respond promptly to official communications from the college administration.

50. I will report any changes to my contact information to the administration immediately.

51. I will use appropriate and professional language in all communications with college staff and fellow students.

52. I will not share confidential college information through unauthorized channels.

ACCOMMODATION OATH (if applicable):

53. If residing in college accommodation, I will comply with all hostel rules and regulations.

54. I will respect the rights and privacy of my roommates and other residents.

55. I will keep my living space clean and tidy.

56. I will not engage in disruptive behavior that disturbs other residents.

57. I will follow all safety protocols in the accommodation.

CONTINUOUS COMMITMENT OATH:

58. I understand that this oath is binding for the entire duration of my studies at Cross College of Health Technology.

59. I agree to uphold these principles under any and all circumstances, regardless of the situation or pressure I may face.

60. I acknowledge that failure to adhere to these principles may have serious consequences for my academic and professional future.

61. I understand that this oath reflects not only on myself but also on Cross College of Health Technology and the healthcare profession.

62. I commit to reviewing this oath regularly and renewing my commitment to these principles.

PROFESSIONAL IDENTITY OATH:

63. I acknowledge that as a future healthcare professional, I am expected to maintain the highest ethical standards.

64. I understand that my conduct reflects not only on myself but also on the college and the healthcare profession.

65. I pledge to uphold the values and reputation of Cross College of Health Technology.

66. I will conduct myself in a manner that brings honor to the institution and the healthcare profession.

67. I will strive to be a role model for other students and future healthcare professionals.

LEGAL ACKNOWLEDGMENT:

68. I hereby declare that all information provided above is true and correct to the best of my knowledge.

69. I understand that any false information may result in the cancellation of my admission.

70. I understand that by signing this oath, I am making a solemn commitment to adhere to all the rules and regulations of Cross College of Health Technology.

71. I acknowledge that this agreement is legally binding and may be used as evidence in disciplinary proceedings.

72. I understand that violation of this oath may result in disciplinary action, up to and including expulsion from the college.

73. I acknowledge that the college reserves the right to modify this oath as necessary, and I will be notified of any changes.

74. I understand that my continued enrollment at the college constitutes acceptance of any modifications to this oath.

FUTURE PROFESSIONAL COMMITMENT:

75. I pledge to carry the principles of this oath beyond my time at Cross College of Health Technology into my professional career.

76. I will continue to uphold professional ethics and standards throughout my career as a healthcare professional.

77. I will be a lifelong learner, continuously improving my knowledge and skills to provide the best possible care.

78. I will advocate for the health and well-being of my patients and communities.

79. I will contribute to the advancement of the healthcare profession through research, innovation, and mentorship.

80. I will maintain my professional integrity even when faced with difficult situations or ethical dilemmas.

DECLARATION AND SIGNATURE:

I hereby declare that I have read, understood, and agree to abide by all the rules, regulations, and guidelines of Cross College of Health Technology as outlined in this oath and the Student Handbook. I understand that this oath is a solemn commitment that will guide my actions throughout my studies and professional career.

I understand that by signing this oath, I am making a binding commitment to adhere to all the rules and regulations of Cross College of Health Technology under any and all circumstances for as long as I remain a student of this institution.

Student Name: ${firstName} ${lastName}
Matric Number: ${matricNumber}
Program: ${program}
Department: ${department}

Student Signature: ______________________

Date: ${oathDate}

Witness Name: ______________________

Witness Signature: ______________________

Date: ${oathDate}

FOR OFFICE USE ONLY:

This oath has been reviewed and accepted by the college administration.

Admission Officer Signature: ______________________

Name: ______________________

Date: ______________________

Registrar Signature: ______________________

Name: ______________________

Date: ______________________

Head of Department Signature: ______________________

Name: ______________________

Date: ______________________

RECORD OF OATH SUBMISSION:

- Oath Submitted: ______________________
- Oath Reviewed: ______________________
- Oath Approved: ______________________
- Student ID Card Issued: ______________________

CROSS COLLEGE OF HEALTH TECHNOLOGY
Excellence in Health Education

This document is official and confidential.
Any unauthorized reproduction or distribution is prohibited.

---
IMPORTANT NOTES FOR THE STUDENT:

1. Please read this oath carefully before signing.
2. Signing this oath indicates your full commitment to abide by all college rules and regulations.
3. Keep a copy of this signed oath for your records.
4. This oath will be placed in your permanent student file.
5. Violation of this oath may result in disciplinary action.
6. If you have any questions about this oath, please contact the Student Affairs Office.

For any clarifications or concerns regarding this oath, please contact:
Student Affairs Office: students@ccht.edu.ng
College Administration: admin@ccht.edu.ng
    `.trim()
}
