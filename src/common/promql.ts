
export enum MatchOperators {
    EQUALS = '=',
    NOT_EQUALS = '!=',
    MATCHES = '=~',
    NOT_MATCHES = '!~',
}

export abstract class PromQLExpression {
    abstract stringify(): string;
}

export interface OperatorAndValue {
    operator: MatchOperators;
    value: string;
}

export type Labels = Record<string, OperatorAndValue>;

enum MatchingModifiers {
    IGNORING = 'ignoring',
    ON = 'on',
}

class PromQLMatchingModifier extends PromQLExpression {
    
    constructor(private modifier: MatchingModifiers, private labels: string[], private left: PromQLExpression) {
        super();
    }

    stringify() {
        return `${this.left.stringify()} ${this.modifier}(${this.labels.join(', ')}) `;
    }

    groupLeft(labels: string[], vectorExpr: PromQLVectorExpression) {
        return new PromQLGroupModifier(GroupModifiers.GROUP_LEFT, labels, this, vectorExpr);
    }

    groupRight(labels: string[], vectorExpr: PromQLVectorExpression) {
        return new PromQLGroupModifier(GroupModifiers.GROUP_RIGHT, labels, this, vectorExpr);
    }
}

enum BinaryOperators {
    ADD = '+',
    SUBTRACT = '-',
    MULTIPLY = '*',
    DIVIDE = '/',
    MODULO = '%',
    POW = '^',
}

class PromQLBinaryExpression extends PromQLExpression {

    constructor(private operator: BinaryOperators, private left: PromQLExpression) {
        super();
    }

    stringify() {
        return `${this.left.stringify()} ${this.operator} `;
    }

    ignoring(labels: string[]) {
        return new PromQLMatchingModifier(MatchingModifiers.IGNORING, labels, this);
    }

    on(labels: string[]) {
        return new PromQLMatchingModifier(MatchingModifiers.ON, labels, this);
    }

    withScalar(scalar: number) {
        return new PromQLScalarExpression(scalar, this);
    }
}

export enum ComparisonOperators {
    EQUALS = '==',
    NOT_EQUALS = '!=',
    GREATER_THAN = '>',
    LESS_THAN = '<',
    GREATER_THAN_OR_EQUALS = '>=',
    LESS_THAN_OR_EQUALS = '<=',
}

class PromQLComparisonExpression extends PromQLExpression {
    
    constructor(private operator: ComparisonOperators, private left: PromQLExpression, private right: PromQLExpression) {
        super();
    }

    stringify() {
        return `${this.left.stringify()} ${this.operator} ${this.right.stringify()} `;
    }
}

enum LogicalOperators {
    AND = 'and',
    OR = 'or',
}

class PromQLLogicalExpression extends PromQLExpression {
    constructor(private operator: LogicalOperators, private left: PromQLExpression, private right: PromQLExpression) {
        super();
    }

    stringify() {
        return `${this.left.stringify()} ${this.operator} (${this.right.stringify()}) `;
    }
}


export abstract class PromQLVectorExpression extends PromQLExpression {
    
    add() {
        return new PromQLBinaryExpression(BinaryOperators.ADD, this);
    }

    subtract() {
        return new PromQLBinaryExpression(BinaryOperators.SUBTRACT, this);
    }

    multiply() {
        return new PromQLBinaryExpression(BinaryOperators.MULTIPLY, this);
    }

    divide() {
        return new PromQLBinaryExpression(BinaryOperators.DIVIDE, this);
    }

    modulo() {
        return new PromQLBinaryExpression(BinaryOperators.MODULO, this);
    }

    pow() {
        return new PromQLBinaryExpression(BinaryOperators.POW, this);
    }

    or(vectorExpr: PromQLVectorExpression) {
        return new PromQLLogicalExpression(LogicalOperators.OR, this, vectorExpr);
    }

    and(vectorExpr: PromQLVectorExpression) {
        return new PromQLLogicalExpression(LogicalOperators.AND, this, vectorExpr);
    }

    equals(value: number) {
        return new PromQLComparisonExpression(ComparisonOperators.EQUALS, this, new PromQLScalarExpression(value));
    }
}

class PromQLScalarExpression extends PromQLVectorExpression {
    constructor(private scalar: number, private left?: PromQLExpression) {
        super();
    }

    stringify() {
        return this.left ? `${this.left.stringify()} ${this.scalar}` : `${this.scalar}`;
    }
}

class PromQLMetric extends PromQLVectorExpression {

    private labels: Record<string, OperatorAndValue> = {};

    constructor(private name: string) {
        super();
    }

    stringify() {

        const labels = Object.entries(this.labels).map(([label, { operator, value }]) => {
            return `${label}${operator}"${value}"`;
        }).join(',');

        return `${this.name}${labels ? `{${labels}}` : ''}`;
    }
    
    withLabel(label: string, operator: MatchOperators, value: string) {
        this.labels[label] = { operator, value };
        return this;
    }

    withLabelEquals(label: string, value: string) {
        return this.withLabel(label, MatchOperators.EQUALS, value);
    }

    withLabelMatches(label: string, value: string) {
        return this.withLabel(label, MatchOperators.MATCHES, value);
    }

    withLabelNotEquals(label: string, value: string) {
        return this.withLabel(label, MatchOperators.NOT_EQUALS, value);
    }

    withLabelNotMatches(label: string, value: string) {
        return this.withLabel(label, MatchOperators.NOT_MATCHES, value);
    }

    withLabelEqualsIf(label: string, value: string, condition: boolean) {
        return condition ? this.withLabelEquals(label, value) : this;
    }

    withLabelMatchesIf(label: string, value: string, condition: boolean) {
        return condition ? this.withLabelMatches(label, value) : this;
    }

    withLabelNotEqualsIf(label: string, value: string, condition: boolean) {
        return condition ? this.withLabelNotEquals(label, value) : this;
    }

    withLabelNotMatchesIf(label: string, value: string, condition: boolean) {
        return condition ? this.withLabelNotMatches(label, value) : this;
    }

    withLabels(labels: Labels) {
        this.labels = { ...this.labels, ...labels };
        return this;
    }
}

enum GroupModifiers {
    GROUP_LEFT = 'group_left',
    GROUP_RIGHT = 'group_right',
}

class PromQLGroupModifier extends PromQLVectorExpression {

    constructor(private modifier: GroupModifiers, private labels: string[], private left: PromQLExpression, private right: PromQLVectorExpression) {
        super();
    }

    stringify() {
        return `${this.left.stringify()} ${this.modifier}(${this.labels.join(', ')}) ${this.right.stringify()} `;
    }
}

class PromByExpression extends PromQLExpression {
    
    constructor(private labels: string[]) {
        super();
    }

    stringify() {
        return ` by (${this.labels.join(',')})`;
    }
}

class PromQLWithoutExpression extends PromQLExpression {
    
    constructor(private labels: Record<string, OperatorAndValue>) {
        super();
    }

    stringify() {
        const labels = Object.entries(this.labels).map(([label, { operator, value }]) => {
            return `${label}${operator}${value}`;
        }).join(',');

        return ` without (${labels})`;
    }
}

class PromQLFunction extends PromQLVectorExpression {
    
    constructor(private name: string, private subExpression: PromQLExpression) {
        super();
    }

    stringify() {
        return `${this.name}(
            ${this.subExpression.stringify()}${this.stringifyInner()}
        )`;
    }

    stringifyInner() {
        return ''
    }
}

class PromQLAggregationFunction extends PromQLFunction {

    private groupingExperssion: PromByExpression | PromQLWithoutExpression | undefined;

    by(labels: string[]) {
        this.groupingExperssion = new PromByExpression(labels);
        return this;
    }

    without(labels: Record<string, OperatorAndValue>) {
        this.groupingExperssion = new PromQLWithoutExpression(labels);
        return this;
    }

    stringify() {
        return `${super.stringify()}${ this.groupingExperssion ? this.groupingExperssion.stringify() : ''}`;
    }
}

class PromQLSumFunction extends PromQLAggregationFunction {

    constructor(subExpression: PromQLExpression) {
        super('sum', subExpression);
    }
}

class PromQLMaxFunction extends PromQLAggregationFunction {
    
    constructor(subExpression: PromQLExpression) {
        super('max', subExpression);
    }
}

class PromQLGroupFunction extends PromQLAggregationFunction {
        
    constructor(subExpression: PromQLExpression) {
        super('group', subExpression);
    }
}

class PromQLCountFunction extends PromQLAggregationFunction {
        
    constructor(subExpression: PromQLExpression) {
        super('count', subExpression);
    }
}

class PromQLSortFunction extends PromQLFunction {
    
    constructor(direction: 'asc' | 'desc', subExpression: PromQLExpression) {
        super(`sort${direction === 'desc' ? '_desc' : ''}`, subExpression);
    }
}

class PromQLRateFunction extends PromQLFunction {       
    constructor(private range: string, subExpression: PromQLExpression) {
        super('rate', subExpression);
    }

    stringifyInner() {
        return `[${this.range}]`;
    }
}

export class PromQL {
    static metric(name: string) {
        return new PromQLMetric(name);
    }

    static sum(subExpression: PromQLExpression) {
        return new PromQLSumFunction(subExpression);
    }

    static sort(direction: 'asc' | 'desc', subExpression: PromQLExpression) {
        return new PromQLSortFunction(direction, subExpression);
    }

    static rate(subExpression: PromQLExpression, range: string) {
        return new PromQLRateFunction(range, subExpression);
    }

    static max(subExpression: PromQLExpression) {
        return new PromQLMaxFunction(subExpression);
    }

    static group(subExpression: PromQLExpression) {
        return new PromQLGroupFunction(subExpression);
    }

    static count(subExpression: PromQLExpression) {
        return new PromQLCountFunction(subExpression);
    }
}
