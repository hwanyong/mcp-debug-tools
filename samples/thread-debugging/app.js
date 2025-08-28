/**
 * MCP Debug Tools - Thread Debugging Example
 * Node.js Worker Threads를 사용한 멀티 스레드 디버깅 예제
 * 메모리 구조, 스레드 간 통신, 병렬 처리를 학습할 수 있습니다.
 */

const {
    Worker,
    isMainThread,
    parentPort,
    workerData,
    MessageChannel,
    MessagePort,
    threadId
} = require('worker_threads');
const os = require('os');
const path = require('path');
const { performance } = require('perf_hooks');

// 공유 메모리를 위한 SharedArrayBuffer
const BUFFER_SIZE = 1024;
const THREADS_COUNT = os.cpus().length;

/**
 * 워커 스레드에서 실행될 코드
 * 별도의 V8 인스턴스에서 실행됩니다
 */
if (!isMainThread) {
    console.log(`[Worker ${threadId}] 스레드 시작, 데이터:`, workerData);
    
    // 워커 스레드의 작업 함수
    function workerTask() {
        const { taskType, data, sharedBuffer } = workerData;
        
        switch (taskType) {
            case 'compute':
                // CPU 집약적 계산 작업
                const result = performHeavyComputation(data);
                parentPort.postMessage({ 
                    type: 'result', 
                    threadId, 
                    result,
                    timestamp: Date.now()
                });
                break;
                
            case 'sort':
                // 대량 데이터 정렬
                const sorted = mergeSort(data);
                parentPort.postMessage({ 
                    type: 'sorted', 
                    threadId, 
                    data: sorted,
                    originalLength: data.length
                });
                break;
                
            case 'search':
                // 병렬 검색 작업
                const found = parallelSearch(data.array, data.target);
                parentPort.postMessage({ 
                    type: 'search_result', 
                    threadId, 
                    found,
                    target: data.target
                });
                break;
                
            case 'shared_memory':
                // SharedArrayBuffer를 사용한 메모리 공유
                if (sharedBuffer) {
                    manipulateSharedMemory(sharedBuffer, threadId);
                }
                break;
                
            default:
                parentPort.postMessage({ 
                    type: 'error', 
                    message: `Unknown task type: ${taskType}` 
                });
        }
    }
    
    // CPU 집약적 계산 함수 (소수 찾기)
    function performHeavyComputation(limit) {
        const primes = [];
        
        for (let num = 2; num <= limit; num++) {
            let isPrime = true;
            
            for (let i = 2; i <= Math.sqrt(num); i++) {
                if (num % i === 0) {
                    isPrime = false;
                    break;
                }
            }
            
            if (isPrime) {
                primes.push(num);
            }
        }
        
        return {
            count: primes.length,
            largest: primes[primes.length - 1],
            sum: primes.reduce((a, b) => a + b, 0)
        };
    }
    
    // 병합 정렬 알고리즘
    function mergeSort(arr) {
        if (arr.length <= 1) return arr;
        
        const mid = Math.floor(arr.length / 2);
        const left = mergeSort(arr.slice(0, mid));
        const right = mergeSort(arr.slice(mid));
        
        return merge(left, right);
    }
    
    function merge(left, right) {
        const result = [];
        let leftIndex = 0;
        let rightIndex = 0;
        
        while (leftIndex < left.length && rightIndex < right.length) {
            if (left[leftIndex] <= right[rightIndex]) {
                result.push(left[leftIndex]);
                leftIndex++;
            } else {
                result.push(right[rightIndex]);
                rightIndex++;
            }
        }
        
        return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
    }
    
    // 병렬 검색 함수
    function parallelSearch(array, target) {
        const results = [];
        
        for (let i = 0; i < array.length; i++) {
            if (array[i] === target) {
                results.push({
                    index: i,
                    value: array[i],
                    threadId: threadId
                });
            }
        }
        
        return results;
    }
    
    // SharedArrayBuffer 조작
    function manipulateSharedMemory(sharedBuffer, workerId) {
        const sharedArray = new Int32Array(sharedBuffer);
        const startIdx = workerId * 10;
        const endIdx = startIdx + 10;
        
        // 각 워커가 자신의 영역에 데이터 쓰기
        for (let i = startIdx; i < endIdx && i < sharedArray.length; i++) {
            // Atomics를 사용한 안전한 메모리 접근
            const oldValue = Atomics.load(sharedArray, i);
            const newValue = oldValue + workerId * 100;
            Atomics.store(sharedArray, i, newValue);
            
            // 디버깅을 위한 로그
            console.log(`[Worker ${workerId}] 메모리[${i}]: ${oldValue} -> ${newValue}`);
        }
        
        // 동기화 포인트
        Atomics.notify(sharedArray, 0, 1);
        
        parentPort.postMessage({
            type: 'memory_updated',
            threadId: workerId,
            range: { start: startIdx, end: endIdx }
        });
    }
    
    // 메시지 수신 핸들러
    parentPort.on('message', (msg) => {
        console.log(`[Worker ${threadId}] 메시지 수신:`, msg);
        
        if (msg.command === 'stop') {
            console.log(`[Worker ${threadId}] 종료 요청 받음`);
            process.exit(0);
        } else if (msg.command === 'ping') {
            parentPort.postMessage({ 
                type: 'pong', 
                threadId,
                timestamp: Date.now()
            });
        }
    });
    
    // 워커 작업 실행
    try {
        workerTask();
    } catch (error) {
        parentPort.postMessage({ 
            type: 'error', 
            threadId,
            error: error.message,
            stack: error.stack
        });
    }
}

/**
 * 메인 스레드 코드
 */
if (isMainThread) {
    console.log('=== MCP Debug Tools - Thread Debugging Example ===');
    console.log(`메인 스레드 ID: ${threadId}`);
    console.log(`사용 가능한 CPU 코어: ${THREADS_COUNT}`);
    console.log('');
    
    /**
     * 워커 풀 클래스
     * 여러 워커 스레드를 관리합니다
     */
    class WorkerPool {
        constructor(size) {
            this.size = size;
            this.workers = [];
            this.queue = [];
            this.activeWorkers = 0;
        }
        
        // 워커 생성
        createWorker(workerData) {
            return new Promise((resolve, reject) => {
                const worker = new Worker(__filename, { workerData });
                
                worker.on('message', (msg) => {
                    console.log(`[Main] 워커 메시지 수신:`, msg);
                    resolve({ worker, message: msg });
                });
                
                worker.on('error', (error) => {
                    console.error(`[Main] 워커 에러:`, error);
                    reject(error);
                });
                
                worker.on('exit', (code) => {
                    console.log(`[Main] 워커 종료, 코드: ${code}`);
                    this.activeWorkers--;
                });
                
                this.workers.push(worker);
                this.activeWorkers++;
            });
        }
        
        // 모든 워커 종료
        async terminateAll() {
            const promises = this.workers.map(worker => worker.terminate());
            await Promise.all(promises);
            this.workers = [];
            this.activeWorkers = 0;
        }
        
        // 워커에게 메시지 전송
        broadcast(message) {
            this.workers.forEach(worker => {
                worker.postMessage(message);
            });
        }
    }
    
    /**
     * 병렬 작업 실행 함수
     */
    async function runParallelTasks() {
        console.log('1. CPU 집약적 계산 작업 (소수 찾기)');
        console.log('----------------------------------------');
        
        const pool = new WorkerPool(4);
        const computeTasks = [];
        
        // 여러 워커에서 동시에 소수 계산
        const ranges = [1000, 2000, 3000, 4000];
        
        for (let i = 0; i < ranges.length; i++) {
            const task = pool.createWorker({
                taskType: 'compute',
                data: ranges[i]
            });
            computeTasks.push(task);
        }
        
        const computeResults = await Promise.all(computeTasks);
        computeResults.forEach((result, index) => {
            console.log(`범위 ${ranges[index]}까지의 소수:`, result.message);
        });
        
        await pool.terminateAll();
        console.log('');
    }
    
    /**
     * 데이터 정렬 작업
     */
    async function runSortingTask() {
        console.log('2. 병렬 데이터 정렬');
        console.log('----------------------------------------');
        
        // 큰 배열을 여러 부분으로 나누어 정렬
        const bigArray = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 10000));
        const chunkSize = Math.ceil(bigArray.length / 4);
        const chunks = [];
        
        for (let i = 0; i < bigArray.length; i += chunkSize) {
            chunks.push(bigArray.slice(i, i + chunkSize));
        }
        
        console.log(`원본 배열 크기: ${bigArray.length}`);
        console.log(`청크 수: ${chunks.length}, 청크 크기: ${chunkSize}`);
        
        const sortWorkers = [];
        
        for (let chunk of chunks) {
            const worker = new Worker(__filename, {
                workerData: {
                    taskType: 'sort',
                    data: chunk
                }
            });
            
            sortWorkers.push(new Promise((resolve) => {
                worker.on('message', (msg) => {
                    resolve(msg.data);
                    worker.terminate();
                });
            }));
        }
        
        const sortedChunks = await Promise.all(sortWorkers);
        
        // 정렬된 청크들을 병합
        const finalSorted = sortedChunks.flat().sort((a, b) => a - b);
        console.log(`정렬 완료: ${finalSorted.length}개 요소`);
        console.log(`첫 10개: [${finalSorted.slice(0, 10).join(', ')}]`);
        console.log(`마지막 10개: [${finalSorted.slice(-10).join(', ')}]`);
        console.log('');
    }
    
    /**
     * SharedArrayBuffer를 사용한 메모리 공유
     */
    async function runSharedMemoryTask() {
        console.log('3. SharedArrayBuffer 메모리 공유');
        console.log('----------------------------------------');
        
        // SharedArrayBuffer 생성 (지원 여부 확인)
        if (typeof SharedArrayBuffer === 'undefined') {
            console.log('⚠️ SharedArrayBuffer가 지원되지 않습니다.');
            console.log('Node.js를 --no-warnings --experimental-worker 플래그와 함께 실행하세요.');
            return;
        }
        
        const sharedBuffer = new SharedArrayBuffer(BUFFER_SIZE);
        const sharedArray = new Int32Array(sharedBuffer);
        
        // 초기값 설정
        for (let i = 0; i < sharedArray.length; i++) {
            sharedArray[i] = i;
        }
        
        console.log(`공유 메모리 크기: ${BUFFER_SIZE} bytes`);
        console.log(`초기값: [${sharedArray.slice(0, 10).join(', ')}...]`);
        
        const memoryWorkers = [];
        
        // 4개의 워커가 동시에 메모리 접근
        for (let i = 0; i < 4; i++) {
            const worker = new Worker(__filename, {
                workerData: {
                    taskType: 'shared_memory',
                    data: null,
                    sharedBuffer: sharedBuffer
                }
            });
            
            memoryWorkers.push(new Promise((resolve) => {
                worker.on('message', (msg) => {
                    if (msg.type === 'memory_updated') {
                        resolve(msg);
                        worker.terminate();
                    }
                });
            }));
        }
        
        await Promise.all(memoryWorkers);
        
        console.log(`최종값: [${sharedArray.slice(0, 20).join(', ')}...]`);
        console.log('');
    }
    
    /**
     * 메시지 채널을 사용한 워커 간 통신
     */
    async function runInterWorkerCommunication() {
        console.log('4. 워커 간 직접 통신');
        console.log('----------------------------------------');
        
        const channel = new MessageChannel();
        
        const worker1 = new Worker(__filename, {
            workerData: {
                taskType: 'search',
                data: {
                    array: Array.from({ length: 100 }, (_, i) => i * 2),
                    target: 50
                }
            },
            transferList: [channel.port1]
        });
        
        const worker2 = new Worker(__filename, {
            workerData: {
                taskType: 'search',
                data: {
                    array: Array.from({ length: 100 }, (_, i) => i * 2 + 1),
                    target: 50
                }
            },
            transferList: [channel.port2]
        });
        
        const results = await Promise.all([
            new Promise(resolve => {
                worker1.on('message', msg => {
                    resolve(msg);
                    worker1.terminate();
                });
            }),
            new Promise(resolve => {
                worker2.on('message', msg => {
                    resolve(msg);
                    worker2.terminate();
                });
            })
        ]);
        
        console.log('워커 1 결과:', results[0]);
        console.log('워커 2 결과:', results[1]);
        console.log('');
    }
    
    /**
     * 성능 측정 함수
     */
    async function measurePerformance() {
        console.log('5. 성능 비교: 단일 스레드 vs 멀티 스레드');
        console.log('----------------------------------------');
        
        const testSize = 5000;
        const testArray = Array.from({ length: testSize }, () => Math.random() * 10000);
        
        // 단일 스레드 정렬
        const singleStart = performance.now();
        const singleSorted = testArray.slice().sort((a, b) => a - b);
        const singleEnd = performance.now();
        const singleTime = singleEnd - singleStart;
        
        console.log(`단일 스레드 정렬: ${singleTime.toFixed(2)}ms`);
        
        // 멀티 스레드 정렬
        const multiStart = performance.now();
        
        // 배열을 4개로 분할
        const chunkSize = Math.ceil(testArray.length / 4);
        const chunks = [];
        for (let i = 0; i < testArray.length; i += chunkSize) {
            chunks.push(testArray.slice(i, i + chunkSize));
        }
        
        const workers = chunks.map(chunk => {
            return new Promise((resolve) => {
                const worker = new Worker(__filename, {
                    workerData: {
                        taskType: 'sort',
                        data: chunk
                    }
                });
                
                worker.on('message', (msg) => {
                    resolve(msg.data);
                    worker.terminate();
                });
            });
        });
        
        const sortedChunks = await Promise.all(workers);
        const multiSorted = sortedChunks.flat().sort((a, b) => a - b);
        const multiEnd = performance.now();
        const multiTime = multiEnd - multiStart;
        
        console.log(`멀티 스레드 정렬: ${multiTime.toFixed(2)}ms`);
        console.log(`성능 향상: ${((singleTime / multiTime - 1) * 100).toFixed(1)}%`);
        console.log('');
    }
    
    /**
     * 메인 실행 함수
     */
    async function main() {
        try {
            // 순차적으로 모든 예제 실행
            await runParallelTasks();
            await runSortingTask();
            await runSharedMemoryTask();
            await runInterWorkerCommunication();
            await measurePerformance();
            
            console.log('=== 모든 테스트 완료 ===');
            console.log('');
            console.log('디버깅 팁:');
            console.log('1. 각 워커의 threadId를 확인하여 스레드 구분');
            console.log('2. 메시지 전달 과정 추적');
            console.log('3. SharedArrayBuffer의 메모리 변화 관찰');
            console.log('4. 워커 생성/종료 라이프사이클 확인');
            
        } catch (error) {
            console.error('메인 에러:', error);
        }
    }
    
    // 메인 함수 실행
    main().catch(console.error);
}