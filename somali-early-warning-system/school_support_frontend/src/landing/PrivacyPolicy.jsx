import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import LandingNav from './components/LandingNav';
import LandingFooter from './components/LandingFooter';

const clauses = [
  {
    number: '1.',
    title: 'Introduction and Scope',
    paragraphs: [
      'This Privacy Policy and End-User Licence Agreement ("Policy") applies to all authorised users of the School Early Warning Support System (AlifMonitor), including administrators, Form Masters, and teachers employed at participating public secondary schools in Mogadishu, Somalia.',
      'This Policy governs the collection, processing, storage, and sharing of personal data within the system. Users are required to read and understand this Policy in full before accessing the system, as continued use constitutes acceptance of all terms contained herein.',
      'Users are expressly advised that this system processes sensitive personal data belonging to minors — students under 18 years of age — and that all use of the system must comply with the obligations and restrictions set out in this Policy.',
    ],
  },
  {
    number: '2.',
    title: 'Data Collection and Purpose',
    paragraphs: [
      'The system collects the following categories of personal data: student identifiers (full name, admission number, classroom assignment), daily attendance records (present, absent, late), automated risk classification scores, intervention case notes and progress records, and parental or guardian contact details where provided by the institution.',
      'All data is collected exclusively for the purpose of student welfare monitoring and early intervention support within the school environment. The purpose limitation principle strictly applies — data collected through this system may not be used for any commercial, research, political, or administrative purpose beyond its stated educational function.',
      'Any use of data outside the scope defined in this Policy, without explicit written authorisation from the institution\'s designated data governance authority, constitutes a breach of this Policy and may result in disciplinary or legal action.',
    ],
  },
  {
    number: '3.',
    title: "Protection of Minors' Data",
    paragraphs: [
      'This system processes personal data belonging to minors — students under 18 years of age enrolled in participating secondary schools. Minors\' data is treated as a priority protected category and is subject to the highest standard of care, confidentiality, and institutional oversight.',
      'No student data shall be disclosed, transferred, shared, or made accessible to any external party, organisation, or individual without explicit written authorisation from the school\'s designated data governance authority. This prohibition applies regardless of the purpose or the identity of the requesting party.',
      'This Policy is aligned with the Somalia Data Protection Act, Law No. 005 of 2023, which establishes the legal framework for the protection of personal data of individuals, including minors, within the Federal Republic of Somalia.',
    ],
  },
  {
    number: '4.',
    title: 'Role-Based Access and Confidentiality',
    paragraphs: [
      'Access to student data within this system is strictly governed by role-based access control (RBAC). Administrators have system-wide access for governance and oversight purposes only. Form Masters may access data exclusively for their assigned classroom. Teachers may access attendance data only for their assigned classes and subjects.',
      'Users are strictly prohibited from sharing login credentials with any other person, accessing data outside their assigned role permissions, or attempting to view, copy, modify, or extract records beyond their authorised scope. Any such action constitutes a serious breach of this Policy.',
      'All system users accept a binding confidentiality obligation upon first login and are personally responsible for maintaining the security and confidentiality of their account credentials and any student data they access in the course of their duties.',
    ],
  },
  {
    number: '5.',
    title: 'Automated Risk Classification Disclaimer',
    paragraphs: [
      'Risk classifications displayed within this system are generated automatically by an algorithm based on predefined attendance thresholds and consecutive absence streak patterns. These scores are indicators only and must not be interpreted as definitive assessments of a student\'s academic standing, character, welfare, or future performance.',
      'All automated risk classifications must be reviewed, contextualised, and validated by the assigned Form Master before any intervention decision is initiated, recorded, or communicated. No intervention action shall be taken solely on the basis of an automated risk score without professional judgement and contextual review by a qualified member of staff.',
      'Human oversight is mandatory at every stage of the intervention process. The institution accepts no liability for decisions made in reliance on automated risk scores without the required human review.',
    ],
  },
  {
    number: '6.',
    title: 'Data Retention and Deletion',
    paragraphs: [
      'Student data collected through this system is retained for the duration of the active academic year plus one additional calendar year, to support continuity of care, institutional reporting, and compliance requirements. Audit logs are retained for a minimum of seven years in accordance with applicable institutional data governance standards.',
      'Following the expiry of the applicable retention period, all associated personal data will be securely and permanently deleted from the system in accordance with data minimisation principles and the requirements of the Somalia Data Protection Act, Law No. 005 of 2023.',
      'Users and guardians have the right to access, correct, and request deletion of personal data held about a student within this system, in line with applicable data protection principles. Users or guardians who wish to exercise these rights may submit a formal written request to the school administrator, who is responsible for facilitating access in compliance with applicable data protection law.',
    ],
  },
  {
    number: '7.',
    title: 'Data Export and Sharing Restrictions',
    paragraphs: [
      'The ability to export student data from this system is restricted exclusively to users holding an administrative role. All data export activities are automatically recorded in the system\'s audit log, which is retained for a minimum of seven years.',
      'Exported data must remain within the school\'s institutional environment at all times. Exported data must not be shared with external parties, uploaded to personal devices or personal cloud storage, or distributed through unofficial channels without prior written approval from the institution\'s data governance authority.',
      'Any unauthorised export, sharing, or distribution of student data constitutes a serious breach of this Policy and may result in disciplinary action and referral to the relevant national data protection authority.',
    ],
  },
  {
    number: '8.',
    title: 'User Obligations — End-User Licence Agreement (EULA)',
    paragraphs: [
      'By accessing this system, all users agree to use it solely for its intended educational and institutional purpose. Users must not attempt to access, copy, modify, delete, or extract any data beyond the permissions granted by their assigned role, and must not attempt to circumvent, disable, or interfere with any security or access control mechanism.',
      'Any misuse of the system, unauthorised access to student records, improper handling or disclosure of personal data, or violation of any term of this Policy may result in immediate suspension of system access and disciplinary action in accordance with the institution\'s staff conduct policy.',
      'Where a breach involves the personal data of minors or constitutes a criminal offence under applicable law, the matter may be referred to the relevant legal authorities under the Somalia Data Protection Act, Law No. 005 of 2023. By continuing to use this system, users acknowledge that they have read, understood, and accepted all terms of this Policy in full.',
    ],
  },
  {
    number: '9.',
    title: 'Consent and Transparency',
    paragraphs: [
      'Informed consent was obtained from all research participants and institutional stakeholders prior to the collection and processing of any personal data during the development and evaluation of this system, in accordance with ethical research standards and the requirements of the Somalia Data Protection Act.',
      'Students and their guardians are informed of the nature, purpose, and scope of data use through the school\'s institutional communication channels. The institution is responsible for ensuring that students and guardians are kept informed of any material changes to data processing practices.',
      'Any individual or guardian who wishes to review the data held about a student, to understand how that data is being used, or to withdraw consent for any non-essential data processing, may submit a formal request to the school administrator, who is obligated to respond within a reasonable timeframe.',
    ],
  },
  {
    number: '10.',
    title: 'Contact and Complaints',
    paragraphs: [
      'Any user who has concerns, questions, or complaints regarding the collection, processing, storage, or handling of personal data within this system should contact the school\'s designated administrator in the first instance. All complaints will be handled in accordance with the institution\'s data governance policy.',
      'The system operates under the oversight of the institution\'s data governance authority, which is responsible for ensuring compliance with this Policy and with the Somalia Data Protection Act, Law No. 005 of 2023.',
      'Where a concern cannot be resolved internally, users retain the right to escalate the matter to the relevant national data protection authority. The institution is committed to cooperating fully with any lawful investigation or inquiry.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero */}
      <section className="bg-green-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-3">
                Privacy Policy &amp; EULA
              </h1>
              <p className="text-gray-600 text-lg">
                School Early Warning Support System — AlifMonitor
              </p>
              <p className="text-sm text-gray-500 mt-2">Last Updated: February 2026</p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro notice */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-gray-600 leading-relaxed">
            This Privacy Policy and End-User Licence Agreement sets out the terms under which personal data is
            collected, processed, and protected within the School Early Warning Support System. It applies to all
            authorised users of the system and must be read in full before accessing any part of the platform.
            This document is governed by the{' '}
            <span className="font-medium text-gray-900">
              Somalia Data Protection Act, Law No. 005 of 2023
            </span>
            , and is aligned with GDPR principles and the AU Data Policy Framework.
          </p>
        </div>
      </section>

      {/* Clauses */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {clauses.map(({ number, title, paragraphs }) => (
            <div key={number}>
              <div className="border-l-4 border-green-600 pl-6 mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {number} {title}
                </h2>
              </div>
              <div className="pl-6 space-y-3">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Legal footer */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
            This policy is governed by the{' '}
            <span className="font-medium text-gray-900">
              Somalia Data Protection Act (Law No. 005 of 2023)
            </span>{' '}
            and aligned with{' '}
            <span className="font-medium text-gray-900">GDPR principles</span> and the{' '}
            <span className="font-medium text-gray-900">AU Data Policy Framework</span>.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            © 2026 School Early Warning Support System. All rights reserved.
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
