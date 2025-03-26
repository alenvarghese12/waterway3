/**
 * Utilities for analyzing cancellation reasons and identifying patterns
 * that might indicate fraudulent behavior
 */

const CancellationRecord = require('../model/CancellationRecord');

/**
 * Analyze common words/phrases in user-provided cancellation reasons
 * to identify potential fraud patterns
 * 
 * @param {string} userId - User ID to analyze (optional)
 * @returns {Object} Analysis results
 */
async function analyzeCancellationReasons(userId = null) {
  try {
    // Query to find cancellation records
    const query = userId ? { userId } : {};
    
    // Get all cancellation records with user-provided reasons
    const cancellations = await CancellationRecord.find({
      ...query,
      userProvidedReason: { $exists: true, $ne: '' }
    }).sort({ cancellationDate: -1 });
    
    if (cancellations.length === 0) {
      return {
        totalAnalyzed: 0,
        commonPhrases: [],
        suspiciousReasons: [],
        analysis: 'No cancellations with reasons found'
      };
    }
    
    // Extract all reasons
    const allReasons = cancellations.map(c => c.userProvidedReason.toLowerCase());
    
    // Define suspicious keywords that might indicate fraud
    const suspiciousKeywords = [
      'mistake', 'wrong', 'accident', 'error', 'test', 'just testing',
      'didn\'t mean', 'didn\'t want', 'change mind', 'better deal',
      'booked twice', 'duplicate', 'cheaper', 'found another'
    ];
    
    // Count frequency of each keyword
    const keywordCounts = {};
    suspiciousKeywords.forEach(keyword => {
      keywordCounts[keyword] = 0;
      allReasons.forEach(reason => {
        if (reason.includes(keyword)) {
          keywordCounts[keyword]++;
        }
      });
    });
    
    // Sort keywords by frequency
    const sortedKeywords = Object.entries(keywordCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ 
        keyword, 
        count, 
        percentage: Math.round((count / allReasons.length) * 100) 
      }));
    
    // Find cancellations with suspicious reasons
    const suspiciousReasons = cancellations
      .filter(c => {
        const reason = c.userProvidedReason.toLowerCase();
        return suspiciousKeywords.some(keyword => reason.includes(keyword));
      })
      .map(c => ({
        cancellationId: c._id,
        userId: c.userId,
        reason: c.userProvidedReason,
        cancellationDate: c.cancellationDate
      }));
    
    // Perform basic analysis
    let analysisText = '';
    if (sortedKeywords.length > 0) {
      const topKeyword = sortedKeywords[0];
      analysisText = `The most common suspicious phrase is "${topKeyword.keyword}" (${topKeyword.percentage}% of cancellations).`;
      
      if (suspiciousReasons.length > allReasons.length * 0.3) {
        analysisText += ' High percentage of suspicious cancellation reasons detected.';
      }
    } else {
      analysisText = 'No suspicious keywords detected in cancellation reasons.';
    }
    
    // Return analysis results
    return {
      totalAnalyzed: allReasons.length,
      commonPhrases: sortedKeywords,
      suspiciousReasons: suspiciousReasons.slice(0, 10), // Limit to top 10
      analysis: analysisText
    };
  } catch (error) {
    console.error('Error analyzing cancellation reasons:', error);
    return {
      error: 'Failed to analyze cancellation reasons',
      details: error.message
    };
  }
}

/**
 * Check if a specific cancellation reason indicates potential fraud
 * 
 * @param {string} reason - User provided cancellation reason
 * @returns {Object} Analysis of the reason
 */
function checkReasonForFraudIndicators(reason) {
  if (!reason || typeof reason !== 'string') {
    return {
      isSuspicious: false,
      confidence: 0,
      indicators: []
    };
  }
  
  const lowerReason = reason.toLowerCase();
  const indicators = [];
  let confidenceScore = 0;
  
  // Check for testing/mistake patterns
  if (lowerReason.includes('test') || lowerReason.includes('testing')) {
    indicators.push('Reason indicates testing');
    confidenceScore += 30;
  }
  
  // Check for accidental booking indicators
  if (lowerReason.includes('accident') || lowerReason.includes('mistake') || 
      lowerReason.includes('error') || lowerReason.includes('wrong')) {
    indicators.push('Reason indicates booking was an accident/mistake');
    confidenceScore += 25;
  }
  
  // Check for changing mind without specific reason
  if (lowerReason.includes('change mind') || lowerReason.includes('changed mind')) {
    indicators.push('Changed mind without specific reason');
    confidenceScore += 15;
  }
  
  // Check for duplicate booking reasons
  if (lowerReason.includes('duplicate') || lowerReason.includes('booked twice')) {
    indicators.push('Possible duplicate booking');
    confidenceScore += 20;
  }
  
  // Check for price comparison/shopping reasons
  if (lowerReason.includes('cheaper') || lowerReason.includes('better deal') || 
      lowerReason.includes('found another')) {
    indicators.push('Price shopping behavior');
    confidenceScore += 15;
  }
  
  // Very short or empty reason
  if (lowerReason.length < 5) {
    indicators.push('Very short/non-descriptive reason');
    confidenceScore += 10;
  }
  
  return {
    isSuspicious: confidenceScore >= 30,
    confidence: Math.min(confidenceScore, 100),
    indicators
  };
}

module.exports = {
  analyzeCancellationReasons,
  checkReasonForFraudIndicators
}; 