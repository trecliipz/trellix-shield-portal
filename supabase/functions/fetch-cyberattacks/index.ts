
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CyberAttack {
  title: string
  description: string
  attack_type: string
  severity: string
  date_detected: string
  source: string
  external_url?: string
  indicators?: any
  affected_products?: string[]
  industries?: string[]
  attack_vectors?: string[]
  business_impact?: string
  mitigation_steps?: string[]
  source_credibility_score?: number
  cvss_score?: number
  cwe_id?: string
  vendor_info?: any
}

// Simple XML parser for Deno environment
function parseXmlToJson(xmlString: string) {
  try {
    const items: any[] = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xmlString)) !== null) {
      const itemContent = match[1];
      const item: any = {};
      
      // Extract title
      const titleMatch = itemContent.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch) {
        item.title = titleMatch[1] || titleMatch[2] || '';
      }
      
      // Extract description
      const descMatch = itemContent.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description[^>]*>([\s\S]*?)<\/description>/i);
      if (descMatch) {
        item.description = descMatch[1] || descMatch[2] || '';
        item.description = item.description.replace(/<[^>]*>/g, '').trim();
      }
      
      // Extract link
      const linkMatch = itemContent.match(/<link[^>]*>(.*?)<\/link>/i);
      if (linkMatch) {
        item.link = linkMatch[1];
      }
      
      // Extract publication date
      const pubDateMatch = itemContent.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
      if (pubDateMatch) {
        item.pubDate = pubDateMatch[1];
      }
      
      items.push(item);
    }
    
    return items;
  } catch (error) {
    console.error('XML parsing error:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting enhanced threat intelligence fetch...')

    const cyberattacks: CyberAttack[] = []

    // Enhanced RSS Feed Processing
    const rssSources = [
      {
        url: 'https://krebsonsecurity.com/feed/',
        name: 'Krebs on Security',
        credibility: 10,
        sector: 'cybersecurity-journalism'
      },
      {
        url: 'https://www.bleepingcomputer.com/feed/',
        name: 'BleepingComputer',
        credibility: 9,
        sector: 'cybersecurity-news'
      },
      {
        url: 'https://feeds.feedburner.com/TheHackersNews',
        name: 'The Hacker News',
        credibility: 8,
        sector: 'cybersecurity-news'
      },
      {
        url: 'https://www.securityweek.com/feed/',
        name: 'Security Week',
        credibility: 8,
        sector: 'enterprise-security'
      }
    ]

    // Process RSS Feeds with custom XML parser
    for (const source of rssSources) {
      try {
        console.log(`Fetching RSS from ${source.name}...`)
        const rssResponse = await fetch(source.url)
        const rssText = await rssResponse.text()
        
        // Parse RSS XML using custom parser
        const items = parseXmlToJson(rssText)
        
        // Process first 3 items from each source
        for (let i = 0; i < Math.min(3, items.length); i++) {
          const item = items[i]
          const title = item.title || ''
          const description = item.description || ''
          const link = item.link || ''
          const pubDate = item.pubDate || new Date().toISOString()
          
          // Enhanced threat classification
          const threatInfo = classifyThreat(title, description)
          
          cyberattacks.push({
            title: cleanHtml(title).substring(0, 200),
            description: cleanHtml(description).substring(0, 500),
            attack_type: threatInfo.type,
            severity: threatInfo.severity,
            date_detected: new Date(pubDate).toISOString(),
            source: source.name,
            external_url: link,
            indicators: threatInfo.indicators,
            affected_products: threatInfo.products,
            industries: threatInfo.industries,
            attack_vectors: threatInfo.vectors,
            business_impact: threatInfo.businessImpact,
            mitigation_steps: [threatInfo.mitigation],
            source_credibility_score: source.credibility
          })
        }
      } catch (error) {
        console.error(`Error fetching RSS from ${source.name}:`, error)
      }
    }

    // NVD API Integration with API Key
    try {
      console.log('Fetching from NVD API...')
      const nvdApiKey = Deno.env.get('NVD_API_KEY') || '8c3d9f3c-5e91-4f45-a75d-6401126bfcf2'
      
      // Get recent vulnerabilities from last 7 days
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      const dateParam = lastWeek.toISOString().split('T')[0]
      
      const nvdResponse = await fetch(
        `https://services.nvd.nist.gov/rest/json/cves/2.0/?startIndex=0&resultsPerPage=10&lastModStartDate=${dateParam}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': nvdApiKey
          }
        }
      )
      
      if (nvdResponse.ok) {
        const nvdData = await nvdResponse.json()
        
        if (nvdData.vulnerabilities) {
          for (const vuln of nvdData.vulnerabilities) {
            const cve = vuln.cve
            const descriptions = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || 'No description available'
            const cvssData = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0]
            const cvssScore = cvssData?.cvssData?.baseScore || 0
            const severity = cvssData?.cvssData?.baseSeverity?.toLowerCase() || 'medium'
            
            // Extract affected products
            const affectedProducts: string[] = []
            if (cve.configurations) {
              for (const config of cve.configurations) {
                for (const node of config.nodes || []) {
                  for (const cpeMatch of node.cpeMatch || []) {
                    if (cpeMatch.criteria) {
                      const product = cpeMatch.criteria.split(':')[4] || 'unknown'
                      if (product !== 'unknown') affectedProducts.push(product)
                    }
                  }
                }
              }
            }
            
            // Get CWE information
            const cweIds = cve.weaknesses?.map((w: any) => w.description?.[0]?.value).filter(Boolean) || []
            const cweId = cweIds[0] || ''
            
            cyberattacks.push({
              title: `${cve.id}: ${descriptions.substring(0, 100)}...`,
              description: descriptions.substring(0, 500),
              attack_type: 'vulnerability',
              severity: severity,
              date_detected: cve.published || new Date().toISOString(),
              source: 'NVD',
              external_url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
              indicators: [cve.id],
              affected_products: [...new Set(affectedProducts)].slice(0, 5),
              industries: ['technology'],
              attack_vectors: ['network', 'application'],
              business_impact: cvssScore >= 7 ? 'High - immediate patching required' : 'Medium - patch when possible',
              mitigation_steps: ['Apply vendor security patches', 'Update affected systems', 'Monitor for exploitation'],
              source_credibility_score: 10,
              cvss_score: cvssScore,
              cwe_id: cweId,
              vendor_info: {
                cvss_vector: cvssData?.cvssData?.vectorString,
                references: cve.references?.slice(0, 3).map((r: any) => r.url) || []
              }
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching NVD data:', error)
    }

    // Enhanced CISA KEV API with better error handling
    try {
      console.log('Fetching from enhanced CISA KEV API...')
      const kevResponse = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json')
      
      if (kevResponse.ok) {
        const kevData = await kevResponse.json()
        
        if (kevData.vulnerabilities) {
          const recentKevs = kevData.vulnerabilities.slice(0, 3)
          for (const vuln of recentKevs) {
            cyberattacks.push({
              title: `${vuln.cveID}: ${vuln.vulnerabilityName}`,
              description: vuln.shortDescription || 'Critical vulnerability actively exploited in the wild',
              attack_type: 'vulnerability',
              severity: 'critical',
              date_detected: vuln.dateAdded || new Date().toISOString(),
              source: 'CISA KEV',
              external_url: 'https://cisa.gov/known-exploited-vulnerabilities',
              indicators: [vuln.cveID],
              affected_products: [vuln.product],
              industries: [determineSector(vuln.product)],
              attack_vectors: ['exploitation'],
              business_impact: 'Critical - system compromise possible',
              mitigation_steps: [vuln.requiredAction || 'Apply security patches immediately'],
              source_credibility_score: 10
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching CISA KEV data:', error)
    }

    // US-CERT Alerts RSS with custom parser
    try {
      console.log('Fetching US-CERT alerts...')
      const certResponse = await fetch('https://www.cisa.gov/uscert/ncas/alerts.xml')
      
      if (certResponse.ok) {
        const certText = await certResponse.text()
        const items = parseXmlToJson(certText)
        
        for (let i = 0; i < Math.min(2, items.length); i++) {
          const item = items[i]
          const title = item.title || ''
          const description = item.description || ''
          const link = item.link || ''
          const pubDate = item.pubDate || new Date().toISOString()
          
          const threatInfo = classifyThreat(title, description)
          
          cyberattacks.push({
            title: cleanHtml(title),
            description: cleanHtml(description).substring(0, 500),
            attack_type: threatInfo.type,
            severity: 'high',
            date_detected: new Date(pubDate).toISOString(),
            source: 'US-CERT',
            external_url: link,
            indicators: threatInfo.indicators,
            affected_products: threatInfo.products,
            industries: threatInfo.industries,
            attack_vectors: threatInfo.vectors,
            business_impact: 'High - follow government guidance',
            mitigation_steps: ['Follow US-CERT recommendations'],
            source_credibility_score: 10
          })
        }
      }
    } catch (error) {
      console.error('Error fetching US-CERT data:', error)
    }

    console.log(`Processed ${cyberattacks.length} threat intelligence items`)

    // Clear old data and insert new attacks
    const { error: deleteError } = await supabase
      .from('cyberattacks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.error('Error clearing old data:', deleteError)
    }

    // Insert new data
    if (cyberattacks.length > 0) {
      const { error } = await supabase
        .from('cyberattacks')
        .insert(cyberattacks)

      if (error) {
        console.error('Error inserting cyberattacks:', error)
        throw error
      }
    }

    // Log the operation
    const { error: logError } = await supabase
      .from('update_logs')
      .insert({
        fetch_timestamp: new Date().toISOString(),
        updates_found: cyberattacks.length,
        new_updates: cyberattacks.length,
        status: 'success'
      })

    if (logError) {
      console.error('Error logging operation:', logError)
    }

    console.log(`Successfully processed ${cyberattacks.length} threat intelligence items`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: cyberattacks.length,
        message: 'Enhanced threat intelligence updated successfully',
        sources: ['Krebs on Security', 'BleepingComputer', 'The Hacker News', 'Security Week', 'CISA KEV', 'US-CERT']
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in enhanced threat intelligence function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch enhanced threat intelligence',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Enhanced threat classification function
function classifyThreat(title: string, description: string) {
  const content = `${title} ${description}`.toLowerCase()
  
  let type = 'data_breach'
  let severity = 'medium'
  let sector = 'technology'
  let impact = 'Data exposure or system compromise'
  let mitigation = 'Follow security best practices'
  let indicators: string[] = []
  let products: string[] = []
  let industries: string[] = []
  let vectors: string[] = []
  let businessImpact = 'Operational disruption possible'

  // Attack type classification
  if (content.includes('ransomware') || content.includes('ransom')) {
    type = 'malware'
    severity = 'critical'
    impact = 'Data encryption and service disruption'
    mitigation = 'Backup restoration, network isolation'
    vectors = ['email', 'remote access']
    businessImpact = 'Critical - service outage and data loss'
  } else if (content.includes('phishing') || content.includes('email attack')) {
    type = 'phishing'
    severity = 'high'
    impact = 'Credential theft and initial access'
    mitigation = 'User training, email filtering'
    vectors = ['email', 'social engineering']
    businessImpact = 'High - credential compromise'
  } else if (content.includes('vulnerability') || content.includes('cve-') || content.includes('exploit')) {
    type = 'vulnerability'
    severity = content.includes('critical') ? 'critical' : 'high'
    impact = 'System compromise through vulnerability exploitation'
    mitigation = 'Apply security patches immediately'
    vectors = ['network', 'application']
    businessImpact = 'High - system compromise possible'
  } else if (content.includes('ddos') || content.includes('denial of service')) {
    type = 'ddos'
    severity = 'medium'
    impact = 'Service unavailability'
    mitigation = 'DDoS protection, traffic filtering'
    vectors = ['network']
    businessImpact = 'Medium - service disruption'
  }

  // Severity enhancement
  if (content.includes('critical') || content.includes('zero-day') || content.includes('widespread')) {
    severity = 'critical'
  } else if (content.includes('high') || content.includes('severe') || content.includes('major')) {
    severity = 'high'
  }

  // Sector identification
  if (content.includes('healthcare') || content.includes('hospital') || content.includes('medical')) {
    sector = 'healthcare'
    industries.push('healthcare')
  } else if (content.includes('financial') || content.includes('bank') || content.includes('finance')) {
    sector = 'finance'
    industries.push('finance')
  } else if (content.includes('government') || content.includes('federal') || content.includes('agency')) {
    sector = 'government'
    industries.push('government')
  } else if (content.includes('education') || content.includes('university') || content.includes('school')) {
    sector = 'education'
    industries.push('education')
  } else if (content.includes('energy') || content.includes('utility') || content.includes('power')) {
    sector = 'energy'
    industries.push('energy')
  }

  // Extract product information
  const productMatches = content.match(/\b(windows|linux|apache|microsoft|google|apple|adobe|oracle|cisco|vmware)\b/g)
  if (productMatches) {
    products = [...new Set(productMatches)]
  }

  return {
    type,
    severity,
    sector,
    impact,
    mitigation,
    indicators,
    products,
    industries,
    vectors,
    businessImpact
  }
}

// Helper function to clean HTML tags
function cleanHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
}

// Helper function to determine sector from product
function determineSector(product: string): string {
  if (!product) return 'technology'
  
  const p = product.toLowerCase()
  if (p.includes('windows') || p.includes('microsoft')) return 'enterprise'
  if (p.includes('cisco') || p.includes('network')) return 'infrastructure'
  if (p.includes('web') || p.includes('browser')) return 'technology'
  if (p.includes('mobile') || p.includes('android') || p.includes('ios')) return 'mobile'
  
  return 'technology'
}
