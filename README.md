# Excel Table Viewer

A modern web application built with Next.js that allows you to upload Excel files (.xlsx, .xls) and view them as interactive, paginated tables with a beautiful UI.

## Features

- 📁 **Drag & Drop Upload**: Simply drag your Excel files or click to browse
- 📊 **Interactive Tables**: View your data in clean, responsive tables
- 📄 **Pagination**: Handle large datasets with built-in pagination (50 rows per page)
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Processing**: Client-side Excel parsing for quick results
- 🔒 **Privacy First**: Files are processed locally in your browser

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Excel Processing**: xlsx library
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd excel-table-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload Excel File**: 
   - Drag and drop your Excel file (.xlsx or .xls) onto the upload area
   - Or click "Browse Files" to select from your computer

2. **View Data**: 
   - The first sheet of your Excel file will be automatically processed and displayed
   - Data is shown in a clean table format with headers

3. **Navigate**: 
   - Use the pagination controls to navigate through large datasets
   - Each page shows up to 50 rows for optimal performance

## Supported File Formats

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket

2. Connect your repository to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Deploy!

The application is pre-configured for Vercel deployment with optimal settings.

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway
- Render

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── file-upload.tsx # File upload component
│   └── excel-table.tsx # Table display component
└── lib/               # Utilities
    ├── utils.ts       # shadcn/ui utilities
    └── excel-parser.ts # Excel parsing logic
```

### Adding New Features

The application is designed to be easily extensible:

- **Multiple Sheets**: Extend `excel-parser.ts` to handle multiple sheets
- **Data Filtering**: Add filtering capabilities to the table component
- **Export Options**: Add functionality to export processed data
- **Custom Styling**: Customize the theme in `globals.css`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please create an issue in the repository.

---

Built with ❤️ using Next.js, shadcn/ui, and modern web technologies.
