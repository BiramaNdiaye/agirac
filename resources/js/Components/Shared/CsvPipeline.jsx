// resources/js/Components/Shared/CSVPipeline.jsx
export default function CSVPipeline({ source, target, direction, fileType }) {
    return (
        <div className={`flex items-center p-3 my-2 bg-gray-50 rounded-lg border-l-4 ${
            direction === 'in' ? 'border-[#45C4EE]' : 'border-[#F78719]'
        }`}>
            <span className={`px-2 py-1 rounded text-xs mr-3 ${
                direction === 'in' ? 'bg-[#45C4EE]' : 'bg-[#F78719]'
            } text-white`}>
                {fileType}
            </span>
            <span className="font-medium mr-2">{source}</span>
            <svg className="w-5 h-5 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="font-medium">{target}</span>
        </div>
    );
}