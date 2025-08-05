/**
 * JSON 문자열에서 주석을 제거하는 함수
 * @param jsonString 원본 JSON 문자열
 * @returns 주석이 제거된 JSON 문자열
 */
export function removeJsonComments(jsonString: string): string {
    // 한 줄 주석 제거 (// 로 시작하는 주석)
    let result = jsonString.replace(/\/\/.*$/gm, '')
    
    // 여러 줄 주석 제거 (/* */ 형태)
    result = result.replace(/\/\*[\s\S]*?\*\//g, '')
    
    // 빈 줄 제거
    result = result.replace(/^\s*[\r\n]/gm, '')
    
    return result.trim()
}

/**
 * 주석이 제거된 JSON을 파싱하는 함수
 * @param jsonString 원본 JSON 문자열
 * @returns 파싱된 JSON 객체
 */
export function parseJsonWithComments(jsonString: string): any {
    const cleanedJson = removeJsonComments(jsonString)
    return JSON.parse(cleanedJson)
} 