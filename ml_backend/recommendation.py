
def generate_recommendations(
    average_power,
    daily_energy,
    monthly_energy,
    target_percentage
):
    recommendations = []

    # 1. Average power consumption
    if average_power >= 1500:
        recommendations.append({
            "title": "Very high power consumption detected",
            "description": "Your average power consumption is above 1500 W. Check high-power appliances such as heaters, ACs and water heaters.",
            "estimated_saving_percent": 12,
            "priority": "High"
        })
    elif average_power >= 1000:
        recommendations.append({
            "title": "Reduce high power consumption",
            "description": "Your average power consumption is above 1000 W. Avoid running multiple high-power appliances together.",
            "estimated_saving_percent": 8,
            "priority": "High"
        })
    elif average_power >= 500:
        recommendations.append({
            "title": "Optimize appliance usage",
            "description": "Your average power consumption is moderate. Switch off appliances when they are not needed.",
            "estimated_saving_percent": 5,
            "priority": "Medium"
        })
    else:
        recommendations.append({
            "title": "Maintain efficient power usage",
            "description": "Your average power consumption is relatively low. Continue using appliances efficiently.",
            "estimated_saving_percent": 3,
            "priority": "Low"
        })

    # 2. Daily energy consumption
    if daily_energy >= 10:
        recommendations.append({
            "title": "Your daily energy usage is very high",
            "description": "You have consumed at least 10 units today. Reduce unnecessary appliance operating hours.",
            "estimated_saving_percent": 10,
            "priority": "High"
        })
    elif daily_energy >= 5:
        recommendations.append({
            "title": "Reduce daily electricity usage",
            "description": "Your daily usage has crossed 5 units. Monitor appliance usage throughout the day.",
            "estimated_saving_percent": 5,
            "priority": "Medium"
        })
    else:
        recommendations.append({
            "title": "Daily energy usage is under control",
            "description": "Your recorded daily consumption is below 5 units. Continue monitoring your usage.",
            "estimated_saving_percent": 3,
            "priority": "Low"
        })

    # 3. Monthly energy consumption
    if monthly_energy >= 200:
        recommendations.append({
            "title": "High monthly energy consumption",
            "description": "Your monthly usage has crossed 200 units. Consider energy-efficient appliances and reduced operating hours.",
            "estimated_saving_percent": 10,
            "priority": "High"
        })
    elif monthly_energy >= 100:
        recommendations.append({
            "title": "Improve monthly energy efficiency",
            "description": "Your monthly consumption has crossed 100 units. Identify appliances that contribute most to your bill.",
            "estimated_saving_percent": 7,
            "priority": "Medium"
        })
    else:
        recommendations.append({
            "title": "Good monthly energy performance",
            "description": "Your recorded monthly consumption is below 100 units. Maintain your current energy-saving habits.",
            "estimated_saving_percent": 3,
            "priority": "Low"
        })

    # 4. Savings target
    if target_percentage >= 30:
        recommendations.append({
            "title": "Your savings target is ambitious",
            "description": "You want to reduce electricity usage by 30% or more. Combine appliance scheduling, usage monitoring and energy-efficient practices.",
            "estimated_saving_percent": 12,
            "priority": "High"
        })
    elif target_percentage >= 20:
        recommendations.append({
            "title": "Work towards your savings target",
            "description": "A 20% reduction requires consistent daily monitoring and avoiding unnecessary electricity consumption.",
            "estimated_saving_percent": 8,
            "priority": "Medium"
        })
    else:
        recommendations.append({
            "title": "Build a consistent savings habit",
            "description": "Follow your savings target by monitoring daily consumption and reducing unnecessary usage.",
            "estimated_saving_percent": 5,
            "priority": "Low"
        })

    return recommendations
