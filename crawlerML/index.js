// Utility function to delay between requests to avoid overwhelming the server
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to sanitize filename by removing invalid characters
const sanitizeFilename = (url) => {
  const filename = url.split('/').slice(-3).join('_').replace(/[^a-z0-9-_]/gi, '_');
  return `${filename}.txt`;
};

// Function to extract main content from HTML
const extractContent = (html) => {
  // Remove scripts and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Extract content within specific sections if they exist
  const mainContentMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainContentMatch) {
    content = mainContentMatch[1];
  }
  
  // Remove remaining HTML tags and decode HTML entities
  content = content.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
    
  return content;
};

// Main crawler function
async function crawlProfiles(urls) {
  console.log(`Starting to crawl ${urls.length} profiles...`);
  const results = {
    success: [],
    failed: []
  };

  try {
    // Determine environment and storage method once, outside the loop
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    let fs;
    if (isNode) {
      fs = require('fs').promises; // Use promises version of fs
    }

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`Processing ${i + 1}/${urls.length}: ${url}`);
      
      try {
        // Make the request with appropriate headers
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const content = extractContent(html);
        const filename = sanitizeFilename(url);

        // Store the content
        // In a browser environment, you might want to use localStorage or download as file
        // For Node.js, you would use fs.writeFileSync
        results.success.push({
          url,
          filename,
          content: content.substring(0, 200) + '...' // Store preview for logging
        });

        // Simplified storage logic
        try {
          if (isNode && fs) {
            await fs.writeFile(filename, content);
            console.log(`Saved to file: ${filename}`);
          } else if (typeof window !== 'undefined') {
            // Browser environment
            const blob = new Blob([content], { type: 'text/plain' });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a); // Ensure element is in DOM
            a.click();
            document.body.removeChild(a); // Clean up
            URL.revokeObjectURL(downloadUrl);
            console.log(`Downloaded: ${filename}`);
          } else {
            console.log('No storage method available, keeping content in memory only');
          }
        } catch (storageError) {
          console.warn(`Failed to save ${filename}:`, storageError);
          // Continue processing but log the error
        }

        // Delay between requests to be polite to the server
        await sleep(1000);
        
      } catch (error) {
        console.error(`Failed to process ${url}:`, error);
        results.failed.push({
          url,
          error: error.message
        });
      }
    }
  } catch (error) {
    console.error('Crawler failed:', error);
  }

  // Generate summary
  console.log('\nCrawl Summary:');
  console.log(`Successfully processed: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed URLs:');
    results.failed.forEach(({url, error}) => {
      console.log(`${url}: ${error}`);
    });
  }

  return results;
}

// Example usage:
const urls = [
  "https://www.mlgts.pt/en/people/associates/Adriana-Bras/20093/",
  "https://www.mlgts.pt/en/people/consultants/Agostinho-Cardoso-Guedes/52/",
  "https://www.mlgts.pt/en/people/principal-associates/Alessandro-Azevedo/20413/",
  "https://www.mlgts.pt/en/people/associates/Alice-Otero-Morgado/20094/",
  "https://www.mlgts.pt/en/people/business-support/Ana-Craveiro/7197/",
  "https://www.mlgts.pt/en/people/business-support/Ana-de-Almeida-Gomes/21712/",
  "https://www.mlgts.pt/en/people/solicitor/Ana-Filipa-Gil/24342/",
  "https://www.mlgts.pt/en/people/senior-lawyers/Ana-Isabel-Seabra/51/",
  "https://www.mlgts.pt/en/people/consultants/Ana-Monjardino/68/",
  "https://www.mlgts.pt/en/people/trainees/Ana-Patricia-Magalhaes/25511/",
  "https://www.mlgts.pt/en/people/business-support/Ana-Pedro-de-Castro/24789/",
  "https://www.mlgts.pt/en/people/senior-lawyers/Ana-Rita-Moreira-Ribeiro/70/",
  "https://www.mlgts.pt/en/people/business-support/Ana-Robin-de-Andrade/73/",
  "https://www.mlgts.pt/en/people/associates/Ana-S-Pereira-Coutinho/21739/",
  "https://www.mlgts.pt/en/people/trainees/Ana-Sofia-Juliao/25527/",
  "https://www.mlgts.pt/en/people/trainees/Ana-Xavier-Nunes/24605/",
  "https://www.mlgts.pt/en/people/partners/Andre-de-Sousa-Vieira/21225/",
  "https://www.mlgts.pt/en/people/managing-associates/Andreia-Bento-Simoes/5060/",
  "https://www.mlgts.pt/en/people/partners/Andreia-Guerreiro/58/",
  "https://www.mlgts.pt/en/people/principal-associates/Anna-Zemskaia/21665/",
  "https://www.mlgts.pt/en/people/partners/Antonio-Corte-Real-Neves/97/",
  "https://www.mlgts.pt/en/people/partners/Antonio-Pinto-Leite/66/",
  "https://www.mlgts.pt/en/people/managing-associates/Antonio-Queiroz-Martins/2163/",
  "https://www.mlgts.pt/en/people/of-counsel/Antonio-Sampaio-Caramelo/44/",
  "https://www.mlgts.pt/en/people/associates/Ashick-Remetula/23749/",
  "https://www.mlgts.pt/en/people/associates/Beatriz-Lopes-da-Silva/21789/",
  "https://www.mlgts.pt/en/people/associates/Beatriz-Malheiros/22599/",
  "https://www.mlgts.pt/en/people/of-counsel/Bernardo-Almeida-Azevedo/316/",
  "https://www.mlgts.pt/en/people/partners/Bernardo-Maria-Lobo-Xavier/46/",
  "https://www.mlgts.pt/en/people/associates/Bernardo-Mesquita/22779/",
  "https://www.mlgts.pt/en/people/associates/Brigida-Magalhaes-Malheiro/21740/",
  "https://www.mlgts.pt/en/people/associates/Bruna-do-Carmo-Bernardino/22684/",
  "https://www.mlgts.pt/en/people/principal-associates/Bruna-Ribeiro-de-Sousa/2752/",
  "https://www.mlgts.pt/en/people/partners/Bruno-Santiago/75/",
  "https://www.mlgts.pt/en/people/international-consultants/Bruno-Xavier-de-Pina/22398/",
  "https://www.mlgts.pt/en/people/senior-lawyers/Carla-Osorio-de-Castro/1638/",
  "https://www.mlgts.pt/en/people/partners/Carlos-Botelho-Moniz/77/",
  "https://www.mlgts.pt/en/people/solicitor/Carlos-Brito-Marques/24345/",
  "https://www.mlgts.pt/en/people/partners/Carlos-Osorio-de-Castro/213/",
  "https://www.mlgts.pt/en/people/trainees/Carlota-Quina-Sampaio/25247/",
  "https://www.mlgts.pt/en/people/principal-associates/Carolina-Barrueca/23369/",
  "https://www.mlgts.pt/en/people/associates/Carolina-Braga-Andrade/25493/",
  "https://www.mlgts.pt/en/people/associates/Carolina-Nagy-Correia/22690/",
  "https://www.mlgts.pt/en/people/associates/Carolina-Ramos-Dias/24400/",
  "https://www.mlgts.pt/en/people/associates/Carolina-Soares-de-Sousa/23673/",
  "https://www.mlgts.pt/en/people/principal-associates/Catarina-Almeida-Andrade/22780/",
  "https://www.mlgts.pt/en/people/associates/Catarina-Balsinhas-Duarte/24399/",
  "https://www.mlgts.pt/en/people/partners/Catarina-Brito-Ferreira/76/",
  "https://www.mlgts.pt/en/people/associates/Catarina-Carvalho-Oliveira/20937/",
  "https://www.mlgts.pt/en/people/trainees/Catarina-De-Sousa-Ribeiro/24614/",
  "https://www.mlgts.pt/en/people/partners/Catarina-Levy-Osorio/1637/",
  "https://www.mlgts.pt/en/people/principal-associates/Catarina-Martins-Morao/6351/",
  "https://www.mlgts.pt/en/people/trainees/Catarina-Moreira-dOrey/24616/",
  "https://www.mlgts.pt/en/people/international-consultants/Catarina-Vieira-Peres-de-Fraipont/22516/",
  "https://www.mlgts.pt/en/people/principal-associates/Clara-Almeida/20096/",
  "https://www.mlgts.pt/en/people/consultants/Claudia-Castanheira-dos-Santos/95/",
  "https://www.mlgts.pt/en/people/partners/Claudia-Santos-Cruz/4831/",
  "https://www.mlgts.pt/en/people/partners/Constanca-Carrington/78/"
];

// Execute the crawler
crawlProfiles(urls).then(results => {
  console.log('Crawling completed!');
}).catch(error => {
  console.error('Crawler failed:', error);
});