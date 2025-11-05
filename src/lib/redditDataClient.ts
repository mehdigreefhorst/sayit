import fuzzysort from 'fuzzysort';

const DATA_ENDPOINT = 'https://anvaka.github.io/sayit-data/3/';

interface SuggestionResult {
  html: string;
  text: string;
}

class RedditDataClient {
  private fileNames: Map<string, string>;
  private downloaded: Map<string, any[]>;
  private indexed: Map<string, any[]>;
  private list: string[];
  private prepared: any[];
  private sizes: Map<string, number>;
  private sizeCount: number;

  constructor() {
    this.fileNames = this.getFileNames();
    this.downloaded = new Map();
    this.indexed = new Map();
    this.list = [];
    this.prepared = [];
    this.sizes = new Map();
    this.sizeCount = 1;

    // Load size data
    this.loadSizes();
  }

  private async loadSizes() {
    try {
      const response = await fetch(DATA_ENDPOINT + 'count.json');
      const rows = await response.json();
      rows.forEach((row: string[], index: number) => {
        row.forEach((subreddit: string) => {
          this.sizes.set(subreddit, index + 2);
        });
      });
      this.sizeCount = rows.length + 2;
    } catch (error) {
      console.error('Failed to load sizes:', error);
    }
  }

  getSize(subName: string): number {
    const size = this.sizes.get(subName);
    return (size || 1) / this.sizeCount;
  }

  async getSuggestion(query: string): Promise<SuggestionResult[]> {
    if (!query || query.length === 0) return [];

    const firstLetter = query[0].toLowerCase();
    const results = this.downloaded.get(firstLetter);

    if (results) {
      const matches = fuzzysort.go(query, this.prepared, { limit: 10 });
      return matches.map((x: any) => ({
        html: fuzzysort.highlight(x, '<b>', '</b>') || x.target,
        text: x.target,
      }));
    } else {
      await this.downloadAndIndexFile(firstLetter);
      return this.getSuggestion(query);
    }
  }

  async getRelated(query: string): Promise<string[]> {
    const sims = this.indexed.get(query.toLowerCase());
    if (sims) return Promise.resolve(sims);

    return this.getFileForQuery(query);
  }

  private async downloadAndIndexFile(firstLetter: string): Promise<void> {
    const fileName = this.fileNames.get(firstLetter);
    if (!fileName) return;

    const url = DATA_ENDPOINT + fileName;
    console.log('download', firstLetter);

    try {
      const response = await fetch(url);
      const data = await response.json();

      this.downloaded.set(firstLetter, data);
      data.forEach((row: any[]) => {
        const keyName = row[0].toLowerCase();
        if (this.indexed.get(keyName)) return;

        this.list.push(row[0]);
        this.indexed.set(keyName, row);
      });
      this.prepared = this.list.map((l) => fuzzysort.prepare(l));
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  }

  private async getFileForQuery(query: string): Promise<string[]> {
    const firstLetter = query[0].toLowerCase();
    const results = this.downloaded.get(firstLetter);

    if (results) return [];

    await this.downloadAndIndexFile(firstLetter);
    const sims = this.indexed.get(query.toLowerCase());
    return sims || [];
  }

  private getFileNames(): Map<string, string> {
    const fileNamesIndex = new Map<string, string>();
    const files = [
      '0_z0123456789jqx.json',
      '10_m.json',
      '11_l.json',
      '12_i.json',
      '13_h.json',
      '14_g.json',
      '15_f.json',
      '16_e.json',
      '17_d.json',
      '18_c.json',
      '19_b.json',
      '1_yk.json',
      '20_a.json',
      '2_w.json',
      '3_vo.json',
      '4_u.json',
      '5_t.json',
      '6_s.json',
      '7_r.json',
      '8_p.json',
      '9_n.json',
    ];

    files.forEach((name) => {
      const fileName = name.replace(/^\d\d?_/, '').replace(/\.json$/, '');
      for (let i = 0; i < fileName.length; i++) {
        const letter = fileName[i];
        fileNamesIndex.set(letter, name);
      }
    });

    return fileNamesIndex;
  }
}

// Create singleton instance
const redditDataClient = new RedditDataClient();

export default redditDataClient;
