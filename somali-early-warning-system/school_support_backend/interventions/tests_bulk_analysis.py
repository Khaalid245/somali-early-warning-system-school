"""
Test Bulk Analysis Service
"""
from django.test import TestCase
from interventions.bulk_analysis_service import BulkAnalysisService


class BulkAnalysisServiceTest(TestCase):
    """Test bulk analysis service functionality"""
    
    def test_analyze_all_students_empty(self):
        """Test analyzing with no students"""
        result = BulkAnalysisService.analyze_all_students()
        
        # Check statistics
        self.assertEqual(result['statistics']['total_students'], 0)
        self.assertIn('critical_count', result['statistics'])
        self.assertIn('high_count', result['statistics'])
        
        # Check risk groups exist
        self.assertIn('critical', result['risk_groups'])
        self.assertIn('high', result['risk_groups'])
        self.assertIn('moderate', result['risk_groups'])
        self.assertIn('low', result['risk_groups'])
    
    def test_generate_priority_list_empty(self):
        """Test priority list with no students"""
        analysis = BulkAnalysisService.analyze_all_students()
        priority_list = BulkAnalysisService.generate_priority_list(analysis, limit=10)
        
        # Should return empty list
        self.assertIsInstance(priority_list, list)
        self.assertEqual(len(priority_list), 0)
    
    def test_weekly_report_empty(self):
        """Test weekly report with no data"""
        report = BulkAnalysisService.generate_weekly_report()
        
        # Check report structure
        self.assertIn('week_ending', report)
        self.assertIn('statistics', report)
        self.assertIn('trend', report)
        self.assertIn('top_priority_students', report)
        self.assertIn('recommendations', report)
        
        # Check trend data
        self.assertIn('direction', report['trend'])
        self.assertIn('last_week_absences', report['trend'])
        self.assertIn('this_week_absences', report['trend'])
