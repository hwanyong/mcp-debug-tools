/**
 * MCP Debug Tools - Basic Debugging Example
 * 이 예제는 함수, 지역 변수, 반복문, 조건문을 통한 기본적인 디버깅을 학습하기 위한 샘플입니다.
 */

// 전역 변수
let globalCounter = 0;
const MAX_ITERATIONS = 10;

/**
 * 데이터 처리 클래스
 * 다양한 데이터 타입과 메서드를 포함합니다
 */
class DataProcessor {
    constructor(name) {
        this.name = name;
        this.data = [];
        this.processCount = 0;
    }

    // 데이터 추가 메서드
    addData(item) {
        if (typeof item === 'object') {
            this.data.push({ ...item, timestamp: Date.now() });
        } else {
            this.data.push({ value: item, timestamp: Date.now() });
        }
        this.processCount++;
    }

    // 데이터 필터링 메서드
    filterData(condition) {
        return this.data.filter(item => {
            // 조건부 브레이크포인트 설정 예제 포인트
            if (item.value && condition(item.value)) {
                return true;
            }
            return false;
        });
    }

    // 데이터 요약 통계
    getSummary() {
        const summary = {
            totalItems: this.data.length,
            processCount: this.processCount,
            processorName: this.name
        };
        
        // 숫자 데이터만 추출하여 통계 계산
        const numericValues = this.data
            .map(item => item.value)
            .filter(val => typeof val === 'number');
        
        if (numericValues.length > 0) {
            summary.average = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
            summary.max = Math.max(...numericValues);
            summary.min = Math.min(...numericValues);
        }
        
        return summary;
    }
}

/**
 * 피보나치 수열 계산 (재귀)
 * 콜스택 추적을 위한 예제 함수
 */
function fibonacci(n) {
    // 기본 케이스
    if (n <= 1) {
        return n;
    }
    
    // 재귀 호출 - 콜스택 깊이 관찰용
    const result = fibonacci(n - 1) + fibonacci(n - 2);
    globalCounter++;
    
    return result;
}

/**
 * 배열 정렬 알고리즘 (버블 정렬)
 * 반복문과 조건문 디버깅 예제
 */
function bubbleSort(arr) {
    const array = [...arr]; // 배열 복사
    const n = array.length;
    let swapped;
    
    // 외부 루프
    for (let i = 0; i < n - 1; i++) {
        swapped = false;
        
        // 내부 루프
        for (let j = 0; j < n - i - 1; j++) {
            // 비교 및 스왑
            if (array[j] > array[j + 1]) {
                // 스왑 수행
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                swapped = true;
            }
        }
        
        // 최적화: 스왑이 없으면 정렬 완료
        if (!swapped) {
            break;
        }
    }
    
    return array;
}

/**
 * 비동기 데이터 처리 함수
 * Promise와 async/await 디버깅 예제
 */
async function fetchDataAsync(id) {
    // 네트워크 요청 시뮬레이션
    return new Promise((resolve, reject) => {
        const delay = Math.random() * 1000;
        
        setTimeout(() => {
            if (id < 0) {
                reject(new Error(`Invalid ID: ${id}`));
            } else {
                resolve({
                    id: id,
                    data: `Data for ID ${id}`,
                    timestamp: new Date().toISOString()
                });
            }
        }, delay);
    });
}

/**
 * 복잡한 객체 구조 처리
 * 중첩된 객체와 배열 디버깅 예제
 */
function processComplexData(input) {
    const result = {
        processed: [],
        errors: [],
        stats: {
            total: 0,
            successful: 0,
            failed: 0
        }
    };
    
    // 입력 데이터 검증
    if (!Array.isArray(input)) {
        result.errors.push('Input must be an array');
        return result;
    }
    
    // 각 항목 처리
    input.forEach((item, index) => {
        result.stats.total++;
        
        try {
            // 조건부 처리
            if (item.type === 'number') {
                const processed = item.value * 2;
                result.processed.push({
                    original: item.value,
                    processed: processed,
                    index: index
                });
                result.stats.successful++;
                
            } else if (item.type === 'string') {
                const processed = item.value.toUpperCase();
                result.processed.push({
                    original: item.value,
                    processed: processed,
                    index: index
                });
                result.stats.successful++;
                
            } else if (item.type === 'array') {
                const sum = item.value.reduce((acc, val) => acc + val, 0);
                result.processed.push({
                    original: item.value,
                    processed: sum,
                    index: index
                });
                result.stats.successful++;
                
            } else {
                throw new Error(`Unknown type: ${item.type}`);
            }
            
        } catch (error) {
            result.errors.push({
                index: index,
                error: error.message,
                item: item
            });
            result.stats.failed++;
        }
    });
    
    return result;
}

/**
 * 에러 처리 예제 함수
 * try-catch와 예외 처리 디버깅
 */
function divideNumbers(a, b) {
    try {
        // 입력 검증
        if (typeof a !== 'number' || typeof b !== 'number') {
            throw new TypeError('Both arguments must be numbers');
        }
        
        // 0으로 나누기 체크
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        
        const result = a / b;
        
        // 결과 검증
        if (!isFinite(result)) {
            throw new Error('Result is not finite');
        }
        
        return {
            success: true,
            result: result,
            operation: `${a} / ${b}`
        };
        
    } catch (error) {
        // 에러 로깅 및 반환
        console.error('Division error:', error.message);
        return {
            success: false,
            error: error.message,
            operation: `${a} / ${b}`
        };
    }
}

/**
 * 메인 실행 함수
 * 모든 예제 함수들을 실행하고 결과를 출력합니다
 */
async function main() {
    console.log('=== MCP Debug Tools - Basic Debugging Example ===\n');
    
    // 1. DataProcessor 클래스 사용
    console.log('1. DataProcessor 클래스 테스트');
    const processor = new DataProcessor('MainProcessor');
    
    // 다양한 데이터 타입 추가
    for (let i = 1; i <= 5; i++) {
        processor.addData(i * 10);
        processor.addData({ id: i, value: i * 100 });
    }
    
    const filtered = processor.filterData(value => value > 25);
    console.log('Filtered data:', filtered);
    console.log('Summary:', processor.getSummary());
    console.log('');
    
    // 2. 피보나치 수열 계산
    console.log('2. 피보나치 수열 계산');
    const fibNumbers = [];
    for (let i = 1; i <= 8; i++) {
        const fib = fibonacci(i);
        fibNumbers.push(fib);
        console.log(`Fibonacci(${i}) = ${fib}`);
    }
    console.log('Global counter:', globalCounter);
    console.log('');
    
    // 3. 배열 정렬
    console.log('3. 버블 정렬 알고리즘');
    const unsorted = [64, 34, 25, 12, 22, 11, 90, 88, 45, 33];
    console.log('Before sorting:', unsorted);
    const sorted = bubbleSort(unsorted);
    console.log('After sorting:', sorted);
    console.log('');
    
    // 4. 비동기 처리
    console.log('4. 비동기 데이터 처리');
    try {
        const promises = [
            fetchDataAsync(1),
            fetchDataAsync(2),
            fetchDataAsync(3)
        ];
        
        const results = await Promise.all(promises);
        results.forEach(result => {
            console.log(`Fetched:`, result);
        });
        
        // 에러 케이스 테스트
        try {
            await fetchDataAsync(-1);
        } catch (error) {
            console.log('Caught error:', error.message);
        }
    } catch (error) {
        console.error('Async error:', error);
    }
    console.log('');
    
    // 5. 복잡한 데이터 처리
    console.log('5. 복잡한 객체 구조 처리');
    const complexInput = [
        { type: 'number', value: 42 },
        { type: 'string', value: 'hello' },
        { type: 'array', value: [1, 2, 3, 4, 5] },
        { type: 'number', value: 100 },
        { type: 'unknown', value: {} },  // 에러 발생 케이스
        { type: 'string', value: 'world' }
    ];
    
    const processResult = processComplexData(complexInput);
    console.log('Process result:', JSON.stringify(processResult, null, 2));
    console.log('');
    
    // 6. 에러 처리 예제
    console.log('6. 에러 처리 예제');
    const divisionTests = [
        { a: 10, b: 2 },
        { a: 100, b: 0 },    // Division by zero
        { a: '10', b: 2 },   // Type error
        { a: 50, b: 5 },
        { a: NaN, b: 10 }    // NaN case
    ];
    
    divisionTests.forEach(test => {
        const result = divideNumbers(test.a, test.b);
        console.log(`Division test:`, result);
    });
    
    console.log('\n=== 모든 테스트 완료 ===');
    console.log('브레이크포인트를 설정하고 디버깅을 시작하세요!');
}

// 프로그램 실행
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});