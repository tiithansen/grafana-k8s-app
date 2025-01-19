
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

enum BinaryOperators {
    ADD = '+',
    SUBTRACT = '-',
    MULTIPLY = '*',
    DIVIDE = '/',
    MODULO = '%',
    POW = '^',
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

    divide(right?: PromQLExpression) {
        return new PromQLBinaryExpression(BinaryOperators.DIVIDE, this);
    }

    modulo() {
        return new PromQLBinaryExpression(BinaryOperators.MODULO, this);
    }

    pow() {
        return new PromQLBinaryExpression(BinaryOperators.POW, this);
    }

    or() {
        return new PromQLLogicalExpression(LogicalOperators.OR, this);
    }

    and() {
        return new PromQLLogicalExpression(LogicalOperators.AND, this);
    }

    equals(value: number) {
        return new PromQLComparisonExpression(ComparisonOperators.EQUALS, this, new PromQLScalarExpression(value));
    }
}

class PromQLMatchingModifier extends PromQLVectorExpression {
    
    private right?: PromQLExpression;

    constructor(private modifier: MatchingModifiers, private labels: string[], private left: PromQLExpression) {
        super();
    }

    stringify() {
        if (this.right) {
            return `${this.left.stringify()} ${this.modifier}(${this.labels.join(', ')}) ${this.right.stringify()}`;
        } else {
            return `${this.left.stringify()} ${this.modifier}(${this.labels.join(', ')})`;
        }
    }

    groupLeft(labels: string[], vectorExpr: PromQLVectorExpression) {
        return new PromQLGroupModifier(GroupModifiers.GROUP_LEFT, labels, this, vectorExpr);
    }

    groupRight(labels: string[], vectorExpr: PromQLVectorExpression) {
        return new PromQLGroupModifier(GroupModifiers.GROUP_RIGHT, labels, this, vectorExpr);
    }

    withExpression(expr: PromQLExpression) {
        this.right = expr;
        return PromQL.parenthesis(this);
    }
}

class PromQLBinaryExpression extends PromQLVectorExpression {

    private right?: PromQLExpression;

    constructor(private operator: BinaryOperators, private left: PromQLExpression) {
        super();
    }

    stringify() {
        if (this.right) {
            return `${this.left.stringify()} ${this.operator} ${this.right.stringify()}`;
        } else {
            return `${this.left.stringify()} ${this.operator}`;
        }
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

    withExpression(expr: PromQLExpression) {
        this.right = expr;
        return PromQL.parenthesis(this);
    }
}

class PromQLParenthesisExpression extends PromQLVectorExpression {
    constructor(private expr: PromQLExpression) {
        super();
    }

    stringify() {
        return `(${this.expr.stringify()})`;
    }
}

enum LogicalOperators {
    AND = 'and',
    OR = 'or',
}

class PromQLLogicalExpression extends PromQLVectorExpression {

    private right?: PromQLExpression;

    constructor(private operator: LogicalOperators, private left: PromQLExpression) {
        super();
    }

    stringify() {
        if (this.right) {
            return `${this.left.stringify()} ${this.operator} ${this.right.stringify()}`;
        } else {
            return `${this.left.stringify()} ${this.operator}`;
        }
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

    withExpression(expr: PromQLExpression) {
        this.right = expr;
        return PromQL.parenthesis(this);
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

class PromQLComparisonExpression extends PromQLVectorExpression {
    
    constructor(private operator: ComparisonOperators, private left: PromQLExpression, private right: PromQLExpression) {
        super();
    }

    stringify() {
        return `${this.left.stringify()} ${this.operator} ${this.right.stringify()} `;
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

class PromQLRangeVectorExpression extends PromQLVectorExpression {

    constructor(private vectorExpression: PromQLVectorExpression, private range: string) {
        super()
    }

    stringify(): string {
        return `${this.vectorExpression.stringify()}[${this.range}]`
    }
}

abstract class PromQLFunctionArg {
    abstract stringify(): string
}

class PromQLVectorExpressionFunctionArg extends PromQLFunctionArg {
    constructor(private arg: PromQLVectorExpression) {
        super()
    }

    stringify(): string {
        return this.arg.stringify()
    }
}

class PromQLStringFunctionArg extends PromQLFunctionArg {
    constructor(private arg: string) {
        super()
    }

    stringify(): string {
        return `"${this.arg}"`
    }
}

class PromQLFunction extends PromQLVectorExpression {
    
    constructor(private name: string, private args: PromQLFunctionArg[]) {
        super();
    }

    stringify() {
        return `${this.name}(
            ${this.serializeArgs()}
        )`;
    }

    private serializeArgs() {
        return this.args.map(
            arg => arg.stringify()
        )
        .join(', ')
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

    constructor(subExpression: PromQLVectorExpression) {
        super('sum', [
            new PromQLVectorExpressionFunctionArg(subExpression)
        ]);
    }
}

class PromQLAvgFunction extends PromQLAggregationFunction {

    constructor(subExpression: PromQLVectorExpression) {
        super('avg', [
            new PromQLVectorExpressionFunctionArg(subExpression)
        ]);
    }
}

class PromQLMaxFunction extends PromQLAggregationFunction {
    
    constructor(subExpression: PromQLVectorExpression) {
        super('max', [
            new PromQLVectorExpressionFunctionArg(subExpression)
        ]);
    }
}

class PromQLGroupFunction extends PromQLAggregationFunction {
        
    constructor(subExpression: PromQLVectorExpression) {
        super('group', [
            new PromQLVectorExpressionFunctionArg(subExpression)
        ])
    }
}

class PromQLCountFunction extends PromQLAggregationFunction {
        
    constructor(subExpression: PromQLVectorExpression) {
        super('count', [
            new PromQLVectorExpressionFunctionArg(subExpression)
        ])
    }
}

class PromQLSortFunction extends PromQLFunction {
    
    constructor(direction: 'asc' | 'desc', subExpression: PromQLVectorExpression) {
        super(`sort${direction === 'desc' ? '_desc' : ''}`, [
            new PromQLVectorExpressionFunctionArg(subExpression)
        ])
    }
}

class PromQLRateFunction extends PromQLFunction {       
    constructor(subExpression: PromQLRangeVectorExpression) {
        super('rate', [
            new PromQLVectorExpressionFunctionArg(subExpression)
        ])
    }
}

class PromQLPresentOverTimeFunction extends PromQLFunction {
        
    constructor(subExpression: PromQLRangeVectorExpression) {
        super('present_over_time', [
            new PromQLVectorExpressionFunctionArg(subExpression)
        ])
    }
}

class PromQLLabelReplaceFunction extends PromQLFunction {
    constructor(exp: PromQLVectorExpression, dest: string, sourceLabel: string, replacement: string, regex: string) {
        super('label_replace', [
            new PromQLVectorExpressionFunctionArg(exp),
            new PromQLStringFunctionArg(dest),
            new PromQLStringFunctionArg(sourceLabel),
            new PromQLStringFunctionArg(replacement),
            new PromQLStringFunctionArg(regex),
        ])
    }
}

export class PromQL {
    static metric(name: string) {
        return new PromQLMetric(name);
    }

    static withRange(subExpression: PromQLVectorExpression, range: string) {
        return new PromQLRangeVectorExpression(subExpression, range)
    }

    static sum(subExpression: PromQLVectorExpression) {
        return new PromQLSumFunction(subExpression);
    }

    static avg(subExpression: PromQLVectorExpression) {
        return new PromQLAvgFunction(subExpression);
    }

    static sort(direction: 'asc' | 'desc', subExpression: PromQLVectorExpression) {
        return new PromQLSortFunction(direction, subExpression);
    }

    static rate(subExpression: PromQLRangeVectorExpression) {
        return new PromQLRateFunction(subExpression);
    }

    static max(subExpression: PromQLVectorExpression) {
        return new PromQLMaxFunction(subExpression);
    }

    static group(subExpression: PromQLVectorExpression) {
        return new PromQLGroupFunction(subExpression);
    }

    static count(subExpression: PromQLVectorExpression) {
        return new PromQLCountFunction(subExpression);
    }

    static presentOverTime(subExpression: PromQLRangeVectorExpression) {
        return new PromQLPresentOverTimeFunction(subExpression);
    }

    static labelReplace(exp: PromQLVectorExpression, dest: string, sourceLabel: string, replacement: string, regex: string) {
        return new PromQLLabelReplaceFunction(exp, dest, replacement, sourceLabel, regex);
    }

    static parenthesis(expr: PromQLVectorExpression) {
        return new PromQLParenthesisExpression(expr)
    }
}
